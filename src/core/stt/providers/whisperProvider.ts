import { ISTTProvider, STTOptions } from '../../types'

interface WhisperResponse {
  text?: string
}

export class WhisperProvider implements ISTTProvider {
  readonly name = 'whisper'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async transcribe(audioBuffer: Buffer, options?: STTOptions): Promise<string> {
    // Create a Blob-like object for the API
    const blob = new Blob([audioBuffer], { type: 'audio/webm' })

    const formData = new FormData()
    formData.append('file', blob, 'recording.webm')
    formData.append('model', 'whisper-1')

    if (options?.language) {
      formData.append('language', options.language)
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      },
      body: formData as never
    })

    if (!response.ok) {
      throw new Error(`Whisper API error (${response.status}): ${await response.text()}`)
    }

    const data = (await response.json()) as WhisperResponse
    return data.text || ''
  }
}
