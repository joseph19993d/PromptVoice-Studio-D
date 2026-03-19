import { IAIProvider, AIGenerateOptions } from '../../types'

interface OllamaGenerateResponse {
  response?: string
}

interface OllamaTagsResponse {
  models?: Array<{ name: string }>
}

export class OllamaProvider implements IAIProvider {
  readonly name = 'ollama'
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  async generateText(prompt: string, options?: AIGenerateOptions): Promise<string> {
    const model = options?.model || 'llama3.2'

    const fullPrompt = options?.systemPrompt
      ? `${options.systemPrompt}\n\nUser: ${prompt}`
      : prompt

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 1024
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error (${response.status}): ${await response.text()}`)
    }

    const data = (await response.json()) as OllamaGenerateResponse
    return data.response || 'No response generated.'
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (!response.ok) return ['llama3.2']
      const data = (await response.json()) as OllamaTagsResponse
      return data.models?.map((m) => m.name) || ['llama3.2']
    } catch {
      return ['llama3.2']
    }
  }
}

