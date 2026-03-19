import { ISTTProvider, STTOptions } from '../../types'

export class MockSTTProvider implements ISTTProvider {
  readonly name = 'mock'

  private mockResponses = [
    'Create a motivational speech about perseverance',
    'Write a short poem about the ocean at sunset',
    'Generate a product description for a smart water bottle',
    'Tell me a fun fact about space exploration',
    'Write a social media post about morning routines'
  ]

  async transcribe(_audioBuffer: Buffer, _options?: STTOptions): Promise<string> {
    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 400))

    const randomIndex = Math.floor(Math.random() * this.mockResponses.length)
    return this.mockResponses[randomIndex]
  }
}
