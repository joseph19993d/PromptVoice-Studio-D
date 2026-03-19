import { IAIProvider, AIGenerateOptions } from '../../types'

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

export class OpenRouterProvider implements IAIProvider {
  readonly name = 'openrouter'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateText(prompt: string, options?: AIGenerateOptions): Promise<string> {
    const model = options?.model || 'mistralai/mistral-7b-instruct'
    const temperature = options?.temperature ?? 0.7
    const maxTokens = options?.maxTokens ?? 1024

    const messages: Array<{ role: string; content: string }> = []

    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt })
    }

    messages.push({ role: 'user', content: prompt })

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://promptvoice-studio.app',
        'X-Title': 'PromptVoice Studio'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`OpenRouter API error (${response.status}): ${errorData}`)
    }

    const data = (await response.json()) as OpenRouterResponse
    return data.choices?.[0]?.message?.content || 'No response generated.'
  }

  async listModels(): Promise<string[]> {
    return [
      'mistralai/mistral-7b-instruct',
      'meta-llama/llama-3.1-8b-instruct:free',
      'google/gemma-2-9b-it:free',
      'openai/gpt-3.5-turbo',
      'openai/gpt-4o-mini',
      'anthropic/claude-3-haiku'
    ]
  }
}

