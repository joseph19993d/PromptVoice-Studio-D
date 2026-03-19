// ============================================
// Vault & Key Validation IPC Handlers
// ============================================

import { ipcMain } from 'electron'
import { IPC_CHANNELS, AppConfig } from '../../core/types'
import { KeyVault, VaultKeyName } from '../../core/storage/keyVault'

interface ValidationResult {
  valid: boolean
  message: string
  details?: string
}

/** Validate an API key by making a lightweight test call */
async function validateKey(provider: VaultKeyName, key: string): Promise<ValidationResult> {
  try {
    switch (provider) {
      case 'openrouter': {
        const res = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            Authorization: `Bearer ${key}`,
            'HTTP-Referer': 'https://promptvoice-studio.app',
            'X-Title': 'PromptVoice Studio'
          }
        })
        if (res.ok) {
          return { valid: true, message: '✅ OpenRouter key is valid! Connected successfully.' }
        }
        const errText = await res.text()
        return { valid: false, message: `❌ Invalid key (${res.status})`, details: errText }
      }

      case 'elevenlabs': {
        const res = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: { 'xi-api-key': key }
        })
        if (res.ok) {
          const data = (await res.json()) as { subscription?: { tier?: string } }
          const tier = data.subscription?.tier || 'unknown'
          return { valid: true, message: `✅ ElevenLabs connected! Plan: ${tier}` }
        }
        return { valid: false, message: `❌ Invalid key (${res.status})` }
      }

      case 'whisper': {
        // Test with OpenAI models endpoint (lightweight)
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` }
        })
        if (res.ok) {
          return { valid: true, message: '✅ OpenAI key is valid! Whisper ready.' }
        }
        return { valid: false, message: `❌ Invalid key (${res.status})` }
      }

      case 'ollama_url': {
        // Test by hitting Ollama's tags endpoint
        const url = key.replace(/\/$/, '')
        const res = await fetch(`${url}/api/tags`)
        if (res.ok) {
          const data = (await res.json()) as { models?: Array<{ name: string }> }
          const count = data.models?.length || 0
          return { valid: true, message: `✅ Ollama connected! ${count} model(s) available.` }
        }
        return { valid: false, message: `❌ Cannot reach Ollama at ${url}` }
      }

      default:
        return { valid: false, message: 'Unknown provider' }
    }
  } catch (err) {
    return {
      valid: false,
      message: `❌ Connection failed`,
      details: (err as Error).message
    }
  }
}

export function registerVaultHandlers(
  onConfigChange: (config: AppConfig) => void
): void {
  // ─── Vault: Store key ───────────────────────
  ipcMain.handle(
    IPC_CHANNELS.VAULT_SET_KEY,
    (_event, name: VaultKeyName, value: string) => {
      try {
        KeyVault.setKey(name, value)

        // Also update the config's keys so managers reinitialize
        const { ConfigService } = require('../../core/storage/configService') as typeof import('../../core/storage/configService')
        const config = ConfigService.getConfig()
        config.keys[name] = value
        ConfigService.setConfig({ keys: config.keys })
        onConfigChange(ConfigService.getConfig())

        return { success: true, data: { masked: KeyVault.getMaskedKey(name) } }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  // ─── Vault: Get key ─────────────────────────
  ipcMain.handle(
    IPC_CHANNELS.VAULT_GET_KEY,
    (_event, name: VaultKeyName) => {
      try {
        return { success: true, data: KeyVault.getKey(name) }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  // ─── Vault: Check key exists ────────────────
  ipcMain.handle(
    IPC_CHANNELS.VAULT_HAS_KEY,
    (_event, name: VaultKeyName) => {
      try {
        return { success: true, data: KeyVault.hasKey(name) }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  // ─── Vault: Remove key ──────────────────────
  ipcMain.handle(
    IPC_CHANNELS.VAULT_REMOVE_KEY,
    (_event, name: VaultKeyName) => {
      try {
        KeyVault.removeKey(name)

        // Also clear from config
        const { ConfigService } = require('../../core/storage/configService') as typeof import('../../core/storage/configService')
        const config = ConfigService.getConfig()
        delete config.keys[name]
        ConfigService.setConfig({ keys: config.keys })
        onConfigChange(ConfigService.getConfig())

        return { success: true }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  // ─── Vault: Get masked key ──────────────────
  ipcMain.handle(
    IPC_CHANNELS.VAULT_GET_MASKED,
    (_event, name: VaultKeyName) => {
      try {
        return { success: true, data: KeyVault.getMaskedKey(name) }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  // ─── Vault: Get all key statuses ────────────
  ipcMain.handle(IPC_CHANNELS.VAULT_GET_STATUS, () => {
    try {
      return { success: true, data: KeyVault.getAllKeyStatus() }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ─── Validate: Test a key ───────────────────
  ipcMain.handle(
    IPC_CHANNELS.VALIDATE_KEY,
    async (_event, provider: VaultKeyName, key: string) => {
      try {
        const result = await validateKey(provider, key)
        return { success: true, data: result }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )
}
