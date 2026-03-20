// ============================================
// PromptVoice Studio — Shared Types & Interfaces
// ============================================

// ─── Provider Interfaces ───────────────────────

export interface IAIProvider {
  readonly name: string
  generateText(prompt: string, options?: AIGenerateOptions): Promise<string>
  listModels?(): Promise<string[]>
}

export interface ITTSProvider {
  readonly name: string
  generateAudio(text: string, options?: TTSOptions): Promise<Buffer>
  listVoices?(): Promise<VoiceInfo[]>
}

export interface ISTTProvider {
  readonly name: string
  transcribe(audioBuffer: Buffer, options?: STTOptions): Promise<string>
}

// ─── Options ───────────────────────────────────

export interface AIGenerateOptions {
  model?: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export interface TTSOptions {
  voiceId?: string
  speed?: number
  pitch?: number
}

export interface STTOptions {
  language?: string
}

// ─── Data Types ────────────────────────────────

export interface VoiceInfo {
  id: string
  name: string
  language?: string
  preview_url?: string
}

export interface HistoryEntry {
  id: string
  timestamp: number
  prompt: string
  result: string
  audioPath?: string
  provider: string
  model?: string
}

// ─── Configuration ─────────────────────────────

export type AIProviderType = 'openrouter' | 'ollama' | 'mock'
export type TTSProviderType = 'elevenlabs' | 'webspeech' | 'mock'
export type STTProviderType = 'whisper' | 'webspeech' | 'mock'

export interface ProviderConfig {
  ai: {
    provider: AIProviderType
    model: string
    systemPrompt: string
    temperature: number
    maxTokens: number
  }
  tts: {
    provider: TTSProviderType
    voiceId: string
    speed: number
  }
  stt: {
    provider: STTProviderType
    language: string
  }
}

export interface APIKeys {
  openrouter?: string
  elevenlabs?: string
  whisper?: string
  ollama_url?: string
}

export interface AppConfig {
  providers: ProviderConfig
  keys: APIKeys
  ui: {
    theme: 'dark' | 'light'
    autoGenerate: boolean  // auto-generate after STT
    setupCompleted: boolean
  }
}

// ─── Default Configuration ─────────────────────

export const DEFAULT_CONFIG: AppConfig = {
  providers: {
    ai: {
      provider: 'mock',
      model: 'mistralai/mistral-small-3.1-24b-instruct',
      systemPrompt: 'You are a helpful, knowledgeable assistant. Respond clearly and concisely in the same language the user writes in. Use markdown formatting when appropriate.',
      temperature: 0.7,
      maxTokens: 1024
    },
    tts: {
      provider: 'mock',
      voiceId: 'default',
      speed: 1.0
    },
    stt: {
      provider: 'mock',
      language: 'en'
    }
  },
  keys: {},
  ui: {
    theme: 'dark',
    autoGenerate: false,
    setupCompleted: false
  }
}

// ─── IPC Channel Names ─────────────────────────

export const IPC_CHANNELS = {
  AI_GENERATE: 'ai:generate',
  AI_MODELS: 'ai:models',
  TTS_GENERATE: 'tts:generate',
  TTS_VOICES: 'tts:voices',
  STT_TRANSCRIBE: 'stt:transcribe',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_GET_KEY: 'config:getKey',
  CONFIG_SET_KEY: 'config:setKey',
  HISTORY_GET: 'history:get',
  HISTORY_ADD: 'history:add',
  HISTORY_CLEAR: 'history:clear',
  // Key Vault
  VAULT_SET_KEY: 'vault:setKey',
  VAULT_GET_KEY: 'vault:getKey',
  VAULT_HAS_KEY: 'vault:hasKey',
  VAULT_REMOVE_KEY: 'vault:removeKey',
  VAULT_GET_MASKED: 'vault:getMasked',
  VAULT_GET_STATUS: 'vault:getStatus',
  // Validation
  VALIDATE_KEY: 'validate:key'
} as const
