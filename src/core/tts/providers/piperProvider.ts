import { DEFAULT_PIPER_VOICE_ID, ITTSProvider, PIPER_VOICES, TTSOptions, VoiceInfo } from '../../types'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

export class PiperProvider implements ITTSProvider {
  readonly name = 'piper'

  private getPiperPath(): string {
    // Determine the environment correctly
    if (process.type === 'browser') {
      const { app } = require('electron')
      if (app.isPackaged) {
        return path.join(process.resourcesPath, 'piper', 'piper.exe')
      }
    }
    // Development fallback
    return path.join(process.cwd(), 'resources', 'piper', 'piper.exe')
  }

  private getVoicesPath(): string {
    if (process.type === 'browser') {
      const { app } = require('electron')
      if (app.isPackaged) {
        return path.join(process.resourcesPath, 'piper', 'voices')
      }
    }
    return path.join(process.cwd(), 'resources', 'piper', 'voices')
  }

  private getPiperBasePath(): string {
    return path.dirname(this.getPiperPath())
  }

  private validateVoiceConfig(configPath: string): void {
    try {
      const rawConfig = fs.readFileSync(configPath, 'utf8').trim()

      if (!rawConfig.startsWith('{')) {
        throw new Error(`Unexpected config contents in ${configPath}`)
      }

      JSON.parse(rawConfig)
    } catch (error) {
      const message = (error as Error).message
      throw new Error(
        `Invalid Piper voice config at ${configPath}. Re-download the voice metadata. Details: ${message}`
      )
    }
  }

  async generateAudio(text: string, options?: TTSOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const piperPath = this.getPiperPath()
        const piperBasePath = this.getPiperBasePath()
        const voicesPath = this.getVoicesPath()

        let voiceId = options?.voiceId || DEFAULT_PIPER_VOICE_ID
        if (voiceId === 'default') {
          voiceId = DEFAULT_PIPER_VOICE_ID
        }
        if (!voiceId.endsWith('.onnx')) {
          voiceId += '.onnx'
        }

        const voiceModelPath = path.join(voicesPath, voiceId)
        const voiceConfigPath = `${voiceModelPath}.json`
        const espeakDataPath = path.join(piperBasePath, 'espeak-ng-data')
        const tashkeelModelPath = path.join(piperBasePath, 'libtashkeel_model.ort')

        if (!fs.existsSync(piperPath)) {
          return reject(new Error(`Piper binary not found at: ${piperPath}. Please ensure Piper is downloaded into resources/piper.`))
        }
        if (!fs.existsSync(voiceModelPath)) {
          return reject(new Error(`Voice model not found at: ${voiceModelPath}.`))
        }
        if (!fs.existsSync(voiceConfigPath)) {
          return reject(new Error(`Voice config not found at: ${voiceConfigPath}.`))
        }
        if (!fs.existsSync(espeakDataPath)) {
          return reject(new Error(`Piper espeak data not found at: ${espeakDataPath}.`))
        }

        this.validateVoiceConfig(voiceConfigPath)

        const outputFileName = `tts-promptvoice-${Date.now()}.wav`
        const outputPath = path.join(os.tmpdir(), outputFileName)

        console.log(`[PiperProvider] Iniciando generación de audio.
- Texto: "${text.substring(0, 50)}..." (${text.length} chars)
- Modelo: ${voiceModelPath}
- Output temp: ${outputPath}`)

        let lengthScale = '1.0'
        let noiseScale = '0.667'
        let noiseW = '0.8'

        if (options?.piperOptions) {
          lengthScale = options.piperOptions.lengthScale.toString()
          noiseScale = options.piperOptions.noiseScale.toString()
          noiseW = options.piperOptions.noiseW.toString()
        }

        // Spawn piper with exact parameters
        const piper = spawn(piperPath, [
          '-m',
          voiceModelPath,
          '-c',
          voiceConfigPath,
          '-f',
          outputPath,
          '--espeak_data',
          espeakDataPath,
          '--tashkeel_model',
          tashkeelModelPath,
          '--length_scale',
          lengthScale,
          '--noise_scale',
          noiseScale,
          '--noise_w',
          noiseW
        ], {
          cwd: piperBasePath
        })

        piper.stdin.write(text)
        piper.stdin.end()

        let errorOutput = ''
        piper.stderr.on('data', (data) => {
          errorOutput += data.toString()
        })

        piper.on('close', (code) => {
          console.log(`[PiperProvider] Proceso finalizado con código: ${code}`)
          if (errorOutput) {
            console.warn(`[PiperProvider] Stderr output: ${errorOutput}`)
          }
          
          if (code !== 0) {
            reject(new Error(`Piper failed with code ${code}. Error: ${errorOutput}`))
            return
          }
          try {
            // Read generated audio and cleanup
            const audioBuffer = fs.readFileSync(outputPath)
            
            // Critical Fix: Piper streaming writes invalid RIFF/Data sizes (sometimes 0 or 0xFFFFFFFF)
            // Chromium's <audio> tag cannot play WAV files with invalid sizes and hangs at 0:00.
            // We binary-patch the WAV header accurately to the exact byte length.
            if (audioBuffer.length >= 44 && audioBuffer.toString('ascii', 0, 4) === 'RIFF') {
              const fileLength = audioBuffer.length
              // Patch RIFF ChunkSize (fileLength - 8) at offset 4
              audioBuffer.writeUInt32LE(fileLength - 8, 4)
              // Patch Subchunk2Size (fileLength - 44) at offset 40
              audioBuffer.writeUInt32LE(fileLength - 44, 40)
            }

            console.log(`[PiperProvider] Audio validado exitosamente. Tamaño del Buffer final: ${audioBuffer.length} bytes.`)

            if (audioBuffer.length < 100) {
              console.warn(`[PiperProvider] ALERTA: El Buffer es demasiado pequeño, el archivo WAV podría estar vacío.`)
            }

            fs.unlink(outputPath, () => {})
            resolve(audioBuffer)
          } catch (err) {
            reject(new Error(`Failed to read output file: ${(err as Error).message}`))
          }
        })

        piper.on('error', (err) => {
          reject(new Error(`Failed to start piper.exe: ${err.message}`))
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  async listVoices(): Promise<VoiceInfo[]> {
    try {
      const voicesPath = this.getVoicesPath()
      if (!fs.existsSync(voicesPath)) {
        console.warn('Piper voices path does not exist:', voicesPath)
        return []
      }

      const files = fs.readdirSync(voicesPath)
      return files
        .filter((f) => f.endsWith('.onnx'))
        .map((f) => {
          const knownVoice = PIPER_VOICES.find((voice) => voice.id === f)
          return knownVoice || {
            id: f,
            name: f.replace('.onnx', ''),
            category: 'local'
          }
        })
    } catch (err) {
      console.error('Error listing piper voices:', err)
      return []
    }
  }
}
