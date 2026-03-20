import { ITTSProvider, TTSOptions, VoiceInfo } from '../../types'

interface ElevenLabsVoicesResponse {
  voices?: Array<{ voice_id: string; name: string; category?: string }>
}

export class ElevenLabsProvider implements ITTSProvider {
  readonly name = 'elevenlabs'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateAudio(text: string, options?: TTSOptions): Promise<Buffer> {
    const voiceId = (options?.voiceId && options.voiceId !== 'default') ? options.voiceId : '21m00Tcm4TlvDq8ikWAM' // Rachel default

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          ...(options?.language && { language_code: options.language }),
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: options?.speed ?? 1.0
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`ElevenLabs API error (${response.status}): ${await response.text()}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  async listVoices(): Promise<VoiceInfo[]> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': this.apiKey }
      })
      if (!response.ok) return this.defaultVoices()
      const data = (await response.json()) as ElevenLabsVoicesResponse
      return (
        data.voices?.map((v) => ({
          id: v.voice_id,
          name: v.name,
          category: v.category
        })) || this.defaultVoices()
      )
    } catch {
      return this.defaultVoices()
    }
  }

  private defaultVoices(): VoiceInfo[] {
    return [
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade' },
      { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade' },
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'premade' },
      { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade' },
      { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', category: 'premade' },
      { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', category: 'premade' }
    ]
  }
}
