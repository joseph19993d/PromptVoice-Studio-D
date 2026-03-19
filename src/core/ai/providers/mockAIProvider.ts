import { IAIProvider, AIGenerateOptions } from '../../types'

export class MockAIProvider implements IAIProvider {
  readonly name = 'mock'

  async generateText(prompt: string, _options?: AIGenerateOptions): Promise<string> {
    // Simulate a small delay
    await new Promise((r) => setTimeout(r, 500))

    return `✨ [Mock AI Response]\n\nYou asked: "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"\n\nThis is a simulated response from the Mock AI provider. To get real AI responses, configure OpenRouter or Ollama in Settings.\n\nHere's a creative sample:\n"Every great journey begins with a single step, and every great idea begins with a single thought. Your prompt has been received — now imagine the possibilities."`
  }

  async listModels(): Promise<string[]> {
    return ['mock-model-v1']
  }
}
