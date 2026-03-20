import { ipcMain } from 'electron'
import { IPC_CHANNELS, TTSOptions } from '../../core/types'
import { TTSManager } from '../../core/tts/ttsManager'

export function registerTTSHandlers(getTTSManager: () => TTSManager): void {
  ipcMain.handle(
    IPC_CHANNELS.TTS_GENERATE,
    async (_event, text: string, options?: TTSOptions) => {
      try {
        const audioBuffer = await getTTSManager().generate(text, options)
        // Convert Buffer to base64 for IPC transport
        return { success: true, data: audioBuffer.toString('base64') }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.TTS_VOICES, async () => {
    try {
      return { success: true, data: await getTTSManager().listVoices() }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
