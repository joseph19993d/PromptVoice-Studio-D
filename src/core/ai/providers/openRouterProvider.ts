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
    const model = options?.model || 'mistralai/mistral-small-3.1-24b-instruct'
    const temperature = options?.temperature ?? 0.7
    const maxTokens = options?.maxTokens ?? 1024

    const messages: Array<{ role: string; content: string }> = []

    const systemPrompt = options?.systemPrompt || 'You are a helpful, knowledgeable assistant. Respond clearly and concisely. Use markdown formatting when appropriate.'
    messages.push({ role: 'system', content: systemPrompt })

    messages.push({ role: 'user', content: prompt })

    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    }

    console.log(`[OpenRouter] Sending request for model: ${model}`, payload)

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://promptvoice-studio.app',
        'X-Title': 'PromptVoice Studio'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`[OpenRouter] API Error ${response.status}:`, errorData)

      if (response.status === 404) {
        throw new Error(
          `Model "${model}" not found on OpenRouter. It may have been removed or renamed. Please select a different model in Settings.`
        )
      }

      if (response.status === 429) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again, or switch to a different model.'
        )
      }

      throw new Error(`OpenRouter API error (${response.status}): ${errorData}`)
    }

    const data = (await response.json()) as OpenRouterResponse
    console.log(`[OpenRouter] Received response successfully.`, data)
    return data.choices?.[0]?.message?.content || 'No response generated.'
  }

  async listModels(): Promise<string[]> {
    return [
      // ⚖️ Balance (recommended)
      'mistralai/mistral-small-3.1-24b-instruct',
      'openai/gpt-4o-mini',
      'meta-llama/llama-3.1-8b-instruct',
      'google/gemini-2.0-flash-001',
      // 💪 Powerful (paid)
      'openai/gpt-4o',
      'anthropic/claude-3.5-haiku',
      'meta-llama/llama-3.3-70b-instruct',
      'mistralai/mixtral-8x7b-instruct'
    ]
  }
}

