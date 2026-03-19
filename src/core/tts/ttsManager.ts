import { ITTSProvider, TTSOptions, TTSProviderType, VoiceInfo } from '../types'
import { MockTTSProvider } from './providers/mockTTSProvider'
import { ElevenLabsProvider } from './providers/elevenLabsProvider'

export class TTSManager {
  private provider: ITTSProvider

  constructor(providerType: TTSProviderType = 'mock', apiKey?: string) {
    this.provider = TTSManager.createProvider(providerType, apiKey)
  }

  static createProvider(type: TTSProviderType, apiKey?: string): ITTSProvider {
    switch (type) {
      case 'elevenlabs':
        return new ElevenLabsProvider(apiKey || '')
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
    return this.provider.generateAudio(text, options)
  }

  async listVoices(): Promise<VoiceInfo[]> {
    if (this.provider.listVoices) {
      return this.provider.listVoices()
    }
    return []
  }
}
