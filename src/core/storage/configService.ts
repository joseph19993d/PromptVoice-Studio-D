import Store from 'electron-store'
import { AppConfig, DEFAULT_CONFIG, APIKeys } from '../types'

const store = new Store<{ config: AppConfig }>({
  defaults: {
    config: DEFAULT_CONFIG
  },
  encryptionKey: 'promptvoice-studio-v1' // Basic encryption for API keys at rest
})

export class ConfigService {
  static getConfig(): AppConfig {
    return store.get('config', DEFAULT_CONFIG)
  }

  static setConfig(config: Partial<AppConfig>): AppConfig {
    const current = ConfigService.getConfig()
    const updated = { ...current, ...config }

    // Deep merge providers
    if (config.providers) {
      updated.providers = {
        ai: { ...current.providers.ai, ...config.providers.ai },
        tts: { ...current.providers.tts, ...config.providers.tts },
        stt: { ...current.providers.stt, ...config.providers.stt }
      }
    }

    // Deep merge UI
    if (config.ui) {
      updated.ui = { ...current.ui, ...config.ui }
    }

    // Deep merge keys
    if (config.keys) {
      updated.keys = { ...current.keys, ...config.keys }
    }

    store.set('config', updated)
    return updated
  }

  static getAPIKey(provider: keyof APIKeys): string | undefined {
    const config = ConfigService.getConfig()
    return config.keys[provider]
  }

  static setAPIKey(provider: keyof APIKeys, key: string): void {
    const config = ConfigService.getConfig()
    config.keys[provider] = key
    store.set('config', config)
  }

  static resetConfig(): AppConfig {
    store.set('config', DEFAULT_CONFIG)
    return DEFAULT_CONFIG
  }

  static isSetupCompleted(): boolean {
    return ConfigService.getConfig().ui.setupCompleted
  }

  static markSetupCompleted(): void {
    const config = ConfigService.getConfig()
    config.ui.setupCompleted = true
    store.set('config', config)
  }
}
