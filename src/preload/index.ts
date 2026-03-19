import { contextBridge, ipcRenderer } from 'electron'
import {
  AIGenerateOptions,
  TTSOptions,
  STTOptions,
  AppConfig,
  APIKeys,
  IPC_CHANNELS
} from '../core/types'

// ─── IPC Response Type ─────────────────────────

interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

async function invokeIPC<T>(channel: string, ...args: unknown[]): Promise<T> {
  const response: IPCResponse<T> = await ipcRenderer.invoke(channel, ...args)
  if (!response.success) {
    throw new Error(response.error || 'Unknown IPC error')
  }
  return response.data as T
}

// ─── Exposed API ───────────────────────────────

const api = {
  // AI
  generateText: (prompt: string, options?: AIGenerateOptions) =>
    invokeIPC<string>(IPC_CHANNELS.AI_GENERATE, prompt, options),

  getModels: () =>
    invokeIPC<string[]>(IPC_CHANNELS.AI_MODELS),

  // TTS
  generateAudio: (text: string, options?: TTSOptions) =>
    invokeIPC<string>(IPC_CHANNELS.TTS_GENERATE, text, options), // returns base64

  getVoices: () =>
    invokeIPC<Array<{ id: string; name: string }>>(IPC_CHANNELS.TTS_VOICES),

  // STT
  transcribe: (audioBase64: string, options?: STTOptions) =>
    invokeIPC<string>(IPC_CHANNELS.STT_TRANSCRIBE, audioBase64, options),

  // Config
  getConfig: () =>
    invokeIPC<AppConfig>(IPC_CHANNELS.CONFIG_GET),

  setConfig: (config: Partial<AppConfig>) =>
    invokeIPC<AppConfig>(IPC_CHANNELS.CONFIG_SET, config),

  getAPIKey: (provider: keyof APIKeys) =>
    invokeIPC<string | undefined>(IPC_CHANNELS.CONFIG_GET_KEY, provider),

  setAPIKey: (provider: keyof APIKeys, key: string) =>
    invokeIPC<void>(IPC_CHANNELS.CONFIG_SET_KEY, provider, key),

  // History
  getHistory: () =>
    invokeIPC<Array<{ id: string; timestamp: number; prompt: string; result: string }>>(
      IPC_CHANNELS.HISTORY_GET
    ),

  addHistory: (entry: { prompt: string; result: string; provider: string; model?: string }) =>
    invokeIPC(IPC_CHANNELS.HISTORY_ADD, entry),

  clearHistory: () =>
    invokeIPC<void>(IPC_CHANNELS.HISTORY_CLEAR)
}

contextBridge.exposeInMainWorld('api', api)

// Export type for renderer
export type ElectronAPI = typeof api
