# Architecture — PromptVoice Studio

## Overview

PromptVoice Studio uses a **4-layer architecture** that separates concerns and makes providers fully swappable:

```
┌──────────────────────────────────────────┐
│          Renderer (React + Zustand)       │  Layer 4: UI
│   Components → Hooks → Store             │
├──────────────────────────────────────────┤
│          Preload (contextBridge)          │  Layer 3: IPC Bridge
│   window.api.generateText(...)           │
├──────────────────────────────────────────┤
│          Main Process (Electron)          │  Layer 2: IPC Handlers
│   ipcMain.handle('ai:generate', ...)     │
├──────────────────────────────────────────┤
│          Core (Managers + Providers)      │  Layer 1: Business Logic
│   AIManager → OpenRouterProvider         │
│   TTSManager → ElevenLabsProvider        │
│   STTManager → WhisperProvider           │
│   ConfigService, HistoryService          │
└──────────────────────────────────────────┘
```

## Data Flow

### Generate Text
```
User types prompt → PromptInput.tsx
  → appStore.generate()
    → window.api.generateText(prompt)  [preload]
      → ipcMain.handle('ai:generate')  [main]
        → aiManager.generate(prompt)   [core]
          → openRouterProvider.generateText()
            → HTTP → OpenRouter API
```

### Voice Input (STT)
```
User holds 🎤 → MicButton.tsx
  → useRecorder.start()
    → MediaRecorder → Blob → base64
      → window.api.transcribe(base64)  [preload]
        → ipcMain.handle('stt:transcribe')  [main]
          → sttManager.transcribe(buffer)   [core]
            → whisperProvider.transcribe()
              → HTTP → OpenAI Whisper API
  → result fills prompt textarea
```

### Text-to-Speech (TTS)
```
User clicks 🔊 → ResultPanel.tsx
  → appStore.generateAndSpeak()
    → window.api.generateAudio(text)  [preload]
      → ipcMain.handle('tts:generate')  [main]
        → ttsManager.generate(text)   [core]
          → elevenLabsProvider.generateAudio()
            → HTTP → ElevenLabs API
  → base64 audio → AudioPlayer.tsx → play
```

## Provider System

Each service (AI, TTS, STT) uses the **Strategy Pattern**:

```typescript
// Interface (contract)
interface IAIProvider {
  readonly name: string
  generateText(prompt: string, options?: AIGenerateOptions): Promise<string>
}

// Manager (delegates to active provider)
class AIManager {
  private provider: IAIProvider
  setProvider(type, apiKey) { this.provider = factory(type, apiKey) }
  generate(prompt) { return this.provider.generateText(prompt) }
}
```

### Adding a New Provider

1. Create `src/core/ai/providers/myProvider.ts` implementing `IAIProvider`
2. Add to factory in `src/core/ai/aiManager.ts`
3. Add provider type to `src/core/types.ts`
4. Add UI option in `SettingsPage.tsx`

## Persistence

- **Config & API Keys**: `electron-store` (JSON, encrypted at rest)
- **History**: JSON file in `app.getPath('userData')/storage/history.json`
- **Audio files**: Downloadable from the player (not stored permanently)

## IPC Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `ai:generate` | Renderer → Main | Generate text with AI |
| `ai:models` | Renderer → Main | List available models |
| `tts:generate` | Renderer → Main | Generate audio from text |
| `tts:voices` | Renderer → Main | List available voices |
| `stt:transcribe` | Renderer → Main | Transcribe audio to text |
| `config:get/set` | Renderer → Main | Read/write app config |
| `history:get/add/clear` | Renderer → Main | Manage prompt history |

All IPC responses follow `{ success: boolean, data?: T, error?: string }`.
