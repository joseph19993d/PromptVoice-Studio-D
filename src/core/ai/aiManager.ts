import { IAIProvider, AIGenerateOptions, AIProviderType } from '../types'
import { MockAIProvider } from './providers/mockAIProvider'
import { OpenRouterProvider } from './providers/openRouterProvider'
import { OllamaProvider } from './providers/ollamaProvider'

export class AIManager {
  private provider: IAIProvider

  constructor(providerType: AIProviderType = 'mock', apiKey?: string, baseUrl?: string) {
    this.provider = AIManager.createProvider(providerType, apiKey, baseUrl)
  }

  static createProvider(type: AIProviderType, apiKey?: string, baseUrl?: string): IAIProvider {
    switch (type) {
      case 'openrouter':
        return new OpenRouterProvider(apiKey || '')
      case 'ollama':
        return new OllamaProvider(baseUrl || 'http://localhost:11434')
      case 'mock':
      default:
        return new MockAIProvider()
    }
  }

  setProvider(type: AIProviderType, apiKey?: string, baseUrl?: string): void {
    this.provider = AIManager.createProvider(type, apiKey, baseUrl)
  }

  get providerName(): string {
    return this.provider.name
  }

  async generate(prompt: string, options?: AIGenerateOptions): Promise<string> {
    return this.provider.generateText(prompt, options)
  }

  async listModels(): Promise<string[]> {
    if (this.provider.listModels) {
      return this.provider.listModels()
    }
    return []
  }
}
