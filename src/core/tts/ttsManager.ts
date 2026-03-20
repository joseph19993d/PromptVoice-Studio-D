import { ITTSProvider, TTSOptions, TTSProviderType, VoiceInfo } from '../types'
import { MockTTSProvider } from './providers/mockTTSProvider'
import { ElevenLabsProvider } from './providers/elevenLabsProvider'
import { PiperProvider } from './providers/piperProvider'

export class TTSManager {
  private provider: ITTSProvider

  constructor(providerType: TTSProviderType = 'mock', apiKey?: string) {
    this.provider = TTSManager.createProvider(providerType, apiKey)
  }

  static createProvider(type: TTSProviderType, apiKey?: string): ITTSProvider {
    switch (type) {
      case 'elevenlabs':
        return new ElevenLabsProvider(apiKey || '')
      case 'piper':
        return new PiperProvider()
      case 'mock':
      default:
        return new MockTTSProvider()
    }
  }

  setProvider(type: TTSProviderType, apiKey?: string): void {
    this.provider = TTSManager.createProvider(type, apiKey)
  }

  get providerName(): string {
    return this.provider.name
  }

  async generate(text: string, options?: TTSOptions): Promise<Buffer> {
    try {
      return await this.provider.generateAudio(text, options)
    } catch (err) {
      const errorMsg = (err as Error).message

      // Intelligent Fallback Strategy
      if (
        this.provider.name === 'elevenlabs' &&
        (errorMsg.includes('quota_exceeded') || 
         errorMsg.includes('payment_required') || 
         errorMsg.includes('402') ||
         errorMsg.includes('fetch failed'))
      ) {
        console.warn('ElevenLabs quota exceeded or unavailable. Falling back to offline Piper Provider...')
        const fallbackProvider = new PiperProvider()
        return await fallbackProvider.generateAudio(text)
      }

      throw err
    }
  }

  async listVoices(): Promise<VoiceInfo[]> {
    if (this.provider.listVoices) {
      return this.provider.listVoices()
    }
    return []
  }
}
