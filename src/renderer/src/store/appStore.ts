import { create } from 'zustand'

export type Page = 'home' | 'settings' | 'debug'

interface AppState {
  // Navigation
  currentPage: Page
  setPage: (page: Page) => void

  // Prompt
  prompt: string
  setPrompt: (text: string) => void

  // Generation
  result: string
  setResult: (text: string) => void
  isGenerating: boolean
  generateError: string | null
  generate: () => Promise<void>

  // Audio
  audioBase64: string | null
  isPlayingAudio: boolean
  setAudioBase64: (data: string | null) => void
  setIsPlayingAudio: (playing: boolean) => void
  generateAndSpeak: () => Promise<void>

  // Recording
  isRecording: boolean
  setIsRecording: (recording: boolean) => void

  // Config
  config: {
    ai: { provider: string; model: string }
    tts: { provider: string; voiceId: string; language: string; piperOptions?: any } // using any here to prevent cyclic type imports, or proper type
    stt: { provider: string }
    setupCompleted: boolean
  } | null
  loadConfig: () => Promise<void>

  // Setup wizard
  showWizard: boolean
  setShowWizard: (show: boolean) => void

  // Global Errors (Toasts)
  appError: string | null
  setAppError: (error: string | null) => void

  // Debug
  debugLogs: Array<{ time: string; level: string; message: string }>
  addDebugLog: (level: string, message: string) => void
  clearDebugLogs: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentPage: 'home',
  setPage: (page) => set({ currentPage: page }),

  // Prompt
  prompt: '',
  setPrompt: (text) => set({ prompt: text }),

  // Generation
  result: '',
  setResult: (text) => set({ result: text }),
  isGenerating: false,
  generateError: null,

  generate: async () => {
    const { prompt } = get()
    if (!prompt.trim()) return

    set({ isGenerating: true, generateError: null, result: '' })

    try {
      const text = await window.api.generateText(prompt)
      set({ result: text, isGenerating: false })

      // Save to history
      window.api.addHistory({ prompt, result: text, provider: 'current' }).catch(() => { })
    } catch (err) {
      set({
        generateError: (err as Error).message,
        isGenerating: false,
        result: `❌ Error: ${(err as Error).message}`
      })
    }
  },

  // Audio
  audioBase64: null,
  isPlayingAudio: false,
  setAudioBase64: (data) => set({ audioBase64: data }),
  setIsPlayingAudio: (playing) => set({ isPlayingAudio: playing }),

  generateAndSpeak: async () => {
    const { result, config } = get()
    if (!result.trim()) return

    try {
      const lang = config?.tts?.language
      const voiceId = config?.tts?.voiceId
      const piperOptions = config?.tts?.piperOptions

      const audioData = await window.api.generateAudio(result, {
        ...(voiceId && { voiceId }),
        ...(lang && lang !== 'auto' && { language: lang }),
        ...(piperOptions && { piperOptions })
      })
      set({ audioBase64: audioData })
    } catch (err) {
      console.error('TTS error:', err)
      set({ appError: `TTS Error: ${(err as Error).message}` })
      setTimeout(() => set({ appError: null }), 5000)
    }
  },

  // Recording
  isRecording: false,
  setIsRecording: (recording) => set({ isRecording: recording }),

  // Config
  config: null,
  loadConfig: async () => {
    try {
      const config = await window.api.getConfig()
      set({
        config: {
          ai: config.providers.ai,
          tts: config.providers.tts,
          stt: config.providers.stt,
          setupCompleted: config.ui.setupCompleted
        },
        showWizard: !config.ui.setupCompleted
      })
    } catch (err) {
      console.error('Failed to load config:', err)
    }
  },

  // Setup wizard
  showWizard: false,
  setShowWizard: (show) => set({ showWizard: show }),

  // Global Errors
  appError: null,
  setAppError: (error) => set({ appError: error }),

  // Debug
  debugLogs: [],
  addDebugLog: (level, message) => set((state) => ({
    debugLogs: [...state.debugLogs, { time: new Date().toISOString(), level, message }]
  })),
  clearDebugLogs: () => set({ debugLogs: [] })
}))
