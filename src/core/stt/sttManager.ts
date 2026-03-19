import { ISTTProvider, STTOptions, STTProviderType } from '../types'
import { MockSTTProvider } from './providers/mockSTTProvider'
import { WhisperProvider } from './providers/whisperProvider'

export class STTManager {
  private provider: ISTTProvider

  constructor(providerType: STTProviderType = 'mock', apiKey?: string) {
    this.provider = STTManager.createProvider(providerType, apiKey)
  }

  static createProvider(type: STTProviderType, apiKey?: string): ISTTProvider {
    switch (type) {
      case 'whisper':
        return new WhisperProvider(apiKey || '')
      case 'mock':
      default:
        return new MockSTTProvider()
    }
  }

  setProvider(type: STTProviderType, apiKey?: string): void {
    this.provider = STTManager.createProvider(type, apiKey)
  }

  get providerName(): string {
    return this.provider.name
  }

  async transcribe(audioBuffer: Buffer, options?: STTOptions): Promise<string> {
    return this.provider.transcribe(audioBuffer, options)
  }
}
