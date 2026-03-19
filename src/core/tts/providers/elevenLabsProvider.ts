import { ITTSProvider, TTSOptions, VoiceInfo } from '../../types'

interface ElevenLabsVoicesResponse {
  voices?: Array<{ voice_id: string; name: string }>
}

export class ElevenLabsProvider implements ITTSProvider {
  readonly name = 'elevenlabs'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateAudio(text: string, options?: TTSOptions): Promise<Buffer> {
    const voiceId = options?.voiceId || '21m00Tcm4TlvDq8ikWAM' // Rachel default

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
          model_id: 'eleven_monolingual_v1',
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
          name: v.name
        })) || this.defaultVoices()
      )
    } catch {
      return this.defaultVoices()
    }
  }

  private defaultVoices(): VoiceInfo[] {
    return [
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
      { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' },
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
      { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
      { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
      { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' }
    ]
  }
}
