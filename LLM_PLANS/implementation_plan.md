# 🎙️ PromptVoice Studio — Full Architecture & Implementation Plan

Build a scalable, production-ready Electron desktop app for AI-powered voice workflows. Users can type or speak prompts, generate AI content, and hear results via TTS — all from a beautiful desktop interface with persistent configuration.

## User Review Required

> [!IMPORTANT]
> **Technology stack decision**: I'm recommending **`electron-vite`** (not `electron-forge`) because it gives us native Vite HMR in both main and renderer processes, simpler config, and better React/TS integration. This is the fastest DX for Electron + React + TS in 2025.

> [!IMPORTANT]
> **State management**: Using **Zustand** instead of Redux — lighter, simpler, and perfect for this app's scale. No boilerplate.

> [!IMPORTANT]
> **Persistence**: Using **`electron-store`** for config/API keys and a simple JSON file system for history/audio. No database needed for MVP.

> [!WARNING]
> **API Keys**: The app stores API keys locally via `electron-store` (encrypted on disk). Users must provide their own keys for OpenRouter, ElevenLabs, etc. Mock providers work without keys for testing.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Electron App                    │
├──────────────┬──────────────────────────────────┤
│  Main Process│  Renderer Process (React)        │
│  (Node.js)   │                                  │
│              │  ┌────────────────────────────┐  │
│  ┌────────┐  │  │  UI Components (React)     │  │
│  │  IPC   │◄─┼──│  └─ Zustand Store          │  │
│  │Handlers│  │  │  └─ Hooks (recorder, audio)│  │
│  └───┬────┘  │  └────────────────────────────┘  │
│      │       │                                  │
│  ┌───▼────┐  │                                  │
│  │  Core  │  │                                  │
│  │Managers│  │                                  │
│  └───┬────┘  │                                  │
│      │       │                                  │
│  ┌───▼──────────────┐                           │
│  │   Providers       │                          │
│  │  ├─ AI (OpenRouter, Ollama, Mock)            │
│  │  ├─ TTS (ElevenLabs, WebSpeech, Mock)        │
│  │  ├─ STT (Whisper, WebSpeech, Mock)           │
│  │  └─ Storage (electron-store)                 │
│  └──────────────────┘                           │
└─────────────────────────────────────────────────┘
```

**Key principle**: The UI never calls APIs directly. Everything flows through IPC → Manager → Provider. Swapping providers requires zero UI changes.

---

## Proposed Changes

### Project Scaffold & Configuration

Summary: Create the full project skeleton, configs, and documentation files.

#### [NEW] [package.json](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/package.json)
- Project metadata, scripts (`dev`, `build`, `preview`, `lint`)
- Dependencies: `react`, `react-dom`, `zustand`, `electron-store`, `lucide-react`
- Dev dependencies: `electron`, `electron-vite`, `vite`, `typescript`, `@types/react`, `@types/react-dom`, `electron-builder`

#### [NEW] [electron.vite.config.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/electron.vite.config.ts)
- Configure main, preload, and renderer entry points
- React plugin for renderer
- Alias `@` → `src/`

#### [NEW] [tsconfig.json](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/tsconfig.json)
- Shared TS config with references to `tsconfig.node.json` and `tsconfig.web.json`

#### [NEW] [tsconfig.node.json](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/tsconfig.node.json)
- For main + preload (Node environment, CommonJS)

#### [NEW] [tsconfig.web.json](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/tsconfig.web.json)
- For renderer (DOM, ESNext, React JSX)

#### [NEW] [.env.example](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/.env.example)
- Template for API keys (OPENROUTER_API_KEY, ELEVENLABS_API_KEY, etc.)

#### [NEW] [.gitignore](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/.gitignore)
- Standard Node + Electron + build ignores

---

### Core Layer (Shared Business Logic)

This layer runs in the **main process** (Node.js). It contains all provider interfaces, manager classes, and storage logic. Zero dependency on Electron APIs.

#### [NEW] [src/core/types.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/core/types.ts)
- `IAIProvider` interface: `generateText(prompt, options?) → Promise<string>`
- `ITTSProvider` interface: `generateAudio(text, options?) → Promise<Buffer>`
- `ISTTProvider` interface: `transcribe(audioBuffer, options?) → Promise<string>`
- `AppConfig` type: selected providers, API keys, voice settings, UI preferences
- `ProviderType` enums: `'openrouter' | 'ollama' | 'mock'` etc.

#### [NEW] [src/core/ai/aiManager.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/core/ai/aiManager.ts)
- Holds active `IAIProvider`, delegates `generate()` calls
- Factory method to switch providers at runtime
- Supports system prompts and model selection

#### [NEW] [src/core/ai/providers/openRouterProvider.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/core/ai/providers/openRouterProvider.ts)
- Calls `https://openrouter.ai/api/v1/chat/completions`
- Supports configurable model, temperature, max_tokens

#### [NEW] [src/core/ai/providers/ollamaProvider.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/core/ai/providers/ollamaProvider.ts)
- Calls local Ollama API (`http://localhost:11434/api/generate`)
- For fully offline AI generation

#### [NEW] [src/core/ai/providers/mockAIProvider.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/core/ai/providers/mockAIProvider.ts)
- Returns static text for testing; no API key needed

#### [NEW] [src/core/tts/ttsManager.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/core/tts/ttsManager.ts)
- Holds active `ITTSProvider`, delegates `generate()` calls

#### [NEW] [src/core/tts/providers/elevenLabsProvider.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/core/tts/providers/elevenLabsProvider.ts)
- Calls ElevenLabs API with voice ID, model selection
- Returns audio Buffer

#### [NEW] [src/core/tts/providers/mockTTSProvider.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/core/tts/providers/mockTTSProvider.ts)
- Returns a pre-recorded sample audio for testing

#### [NEW] [src/core/stt/sttManager.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/core/stt/sttManager.ts)
- Holds active `ISTTProvider`, delegates `transcribe()` calls

#### [NEW] [src/core/stt/providers/whisperProvider.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/core/stt/providers/whisperProvider.ts)
- Calls OpenAI Whisper API or compatible endpoint
- Accepts audio buffer, returns text

#### [NEW] [src/core/stt/providers/mockSTTProvider.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/core/stt/providers/mockSTTProvider.ts)
- Returns mock transcription text

#### [NEW] [src/core/storage/configService.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/core/storage/configService.ts)
- Uses `electron-store` for persistent JSON config
- Methods: `getConfig()`, `setConfig()`, `getAPIKey()`, `setAPIKey()`
- Default config with mock providers

#### [NEW] [src/core/storage/historyService.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/core/storage/historyService.ts)
- Saves prompt/response history to JSON file in app data dir
- Methods: `addEntry()`, `getHistory()`, `clearHistory()`

---

### Electron Layer (Main + Preload + IPC)

#### [NEW] [src/main/index.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/main/index.ts)
- Create BrowserWindow with proper webPreferences
- Load renderer in dev (localhost) / production (file://)
- Initialize managers with providers from saved config
- Register all IPC handlers

#### [NEW] [src/main/ipc/ai.ipc.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/main/ipc/ai.ipc.ts)
- `ai:generate` → `aiManager.generate(prompt, options)`
- `ai:models` → return available models for current provider

#### [NEW] [src/main/ipc/tts.ipc.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/main/ipc/tts.ipc.ts)
- `tts:generate` → `ttsManager.generate(text, options)`
- `tts:voices` → return available voices

#### [NEW] [src/main/ipc/stt.ipc.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/main/ipc/stt.ipc.ts)
- `stt:transcribe` → `sttManager.transcribe(audioBuffer)`

#### [NEW] [src/main/ipc/config.ipc.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/main/ipc/config.ipc.ts)
- `config:get` → return full config
- `config:set` → update config + reinitialize affected managers
- `config:getKey` / `config:setKey` → API key management

#### [NEW] [src/preload/index.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/preload/index.ts)
- Use `contextBridge.exposeInMainWorld('api', {...})`
- Expose typed functions: `generateText`, `generateAudio`, `transcribe`, `getConfig`, `setConfig`, etc.

#### [NEW] [src/preload/index.d.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/preload/index.d.ts)
- TypeScript declarations for `window.api` (consumed by renderer)

---

### Frontend (React Renderer)

#### [NEW] [src/renderer/index.html](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/index.html)
- HTML entry point with `<div id="root">`

#### [NEW] [src/renderer/src/main.tsx](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/main.tsx)
- React root render

#### [NEW] [src/renderer/src/App.tsx](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/App.tsx)
- Main layout: Sidebar + Content area
- Route between Home (prompt workspace) and Settings

#### [NEW] [src/renderer/src/index.css](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/index.css)
- Design system: dark theme, CSS variables, typography (Inter font)
- Glassmorphism panels, smooth gradients, micro-animations

#### [NEW] [src/renderer/src/store/appStore.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/store/appStore.ts)
- Zustand store: prompt, result, isGenerating, isRecording, config, history
- Actions: generate, transcribe, playAudio, updateConfig

#### [NEW] [src/renderer/src/hooks/useRecorder.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/hooks/useRecorder.ts)
- MediaRecorder API wrapper
- Returns `{ start, stop, isRecording, audioBlob }`
- Auto-sends to STT on stop → fills prompt area

#### [NEW] [src/renderer/src/hooks/useAudioPlayer.ts](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/hooks/useAudioPlayer.ts)
- Audio playback with play/pause/stop
- Waveform visualization data

#### [NEW] [src/renderer/src/components/Sidebar.tsx](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/components/Sidebar.tsx)
- Nav: Home, History, Settings
- App branding, status indicators (AI/TTS/STT connected)

#### [NEW] [src/renderer/src/components/PromptInput.tsx](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/components/PromptInput.tsx)
- Rich textarea with placeholder, character count
- Mic button inline

#### [NEW] [src/renderer/src/components/MicButton.tsx](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/components/MicButton.tsx)
- Animated recording indicator (pulsing ring)
- Hold-to-record or toggle-to-record modes
- Visual feedback: idle → recording → processing

#### [NEW] [src/renderer/src/components/GenerateButton.tsx](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/components/GenerateButton.tsx)
- Primary CTA with loading spinner
- Disabled when no prompt text

#### [NEW] [src/renderer/src/components/ResultPanel.tsx](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/components/ResultPanel.tsx)
- Displays generated text
- "Read Aloud" button → TTS
- Copy to clipboard button

#### [NEW] [src/renderer/src/components/AudioPlayer.tsx](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/components/AudioPlayer.tsx)
- Waveform visualization
- Play/pause, seek, download controls

#### [NEW] [src/renderer/src/components/SettingsPage.tsx](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/components/SettingsPage.tsx)
- Provider selection (AI, TTS, STT) with dropdowns
- API key inputs (masked)
- Voice selection (for TTS)
- Model selection (for AI)
- Test connection buttons

#### [NEW] [src/renderer/src/components/SetupWizard.tsx](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/src/renderer/src/components/SetupWizard.tsx)
- 6-step onboarding wizard (Welcome → Mode → AI → TTS → Mic → Done)
- Shows on first launch
- Saves config on completion

---

### Documentation

#### [MODIFY] [README.md](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/README.md)
- Professional README with: features, screenshots, tech stack, quick start, architecture overview, contributing guide link, license

#### [NEW] [ARCHITECTURE.md](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/ARCHITECTURE.md)
- Detailed layered architecture documentation
- Data flow diagrams
- Provider system explanation
- IPC communication reference
- How to add new providers

#### [NEW] [CONTRIBUTING.md](file:///c:/Users/Joseph%20Rodelo%20S/Documents/GitHub/PromptVoice%20Studio/CONTRIBUTING.md)
- Development setup, coding conventions, PR process

---

## Final Project Structure

```
promptvoice-studio/
├── src/
│   ├── core/                          # Business logic (platform agnostic)
│   │   ├── types.ts                   # Shared interfaces & types
│   │   ├── ai/
│   │   │   ├── aiManager.ts
│   │   │   └── providers/
│   │   │       ├── openRouterProvider.ts
│   │   │       ├── ollamaProvider.ts
│   │   │       └── mockAIProvider.ts
│   │   ├── tts/
│   │   │   ├── ttsManager.ts
│   │   │   └── providers/
│   │   │       ├── elevenLabsProvider.ts
│   │   │       └── mockTTSProvider.ts
│   │   ├── stt/
│   │   │   ├── sttManager.ts
│   │   │   └── providers/
│   │   │       ├── whisperProvider.ts
│   │   │       └── mockSTTProvider.ts
│   │   └── storage/
│   │       ├── configService.ts
│   │       └── historyService.ts
│   │
│   ├── main/                          # Electron main process
│   │   ├── index.ts
│   │   └── ipc/
│   │       ├── ai.ipc.ts
│   │       ├── tts.ipc.ts
│   │       ├── stt.ipc.ts
│   │       └── config.ipc.ts
│   │
│   ├── preload/                       # Electron preload (bridge)
│   │   ├── index.ts
│   │   └── index.d.ts
│   │
│   └── renderer/                      # React frontend
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── index.css
│           ├── store/
│           │   └── appStore.ts
│           ├── hooks/
│           │   ├── useRecorder.ts
│           │   └── useAudioPlayer.ts
│           └── components/
│               ├── Sidebar.tsx
│               ├── PromptInput.tsx
│               ├── MicButton.tsx
│               ├── GenerateButton.tsx
│               ├── ResultPanel.tsx
│               ├── AudioPlayer.tsx
│               ├── SettingsPage.tsx
│               └── SetupWizard.tsx
│
├── resources/                         # App icons, assets
├── electron.vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── ARCHITECTURE.md
└── CONTRIBUTING.md
```

---

## Verification Plan

### Automated Tests
Since this is a new project scaffold with an Electron + React setup, traditional unit tests aren't ideal for the first iteration. Instead:

1. **Build verification**: `npm run build` must complete without errors
2. **TypeScript check**: `npx tsc --noEmit` must pass with zero errors
3. **Dev server launch**: `npm run dev` must launch the Electron window

### Manual Verification (User)
1. Run `npm install` → verify all dependencies install without errors
2. Run `npm run dev` → verify:
   - Electron window opens with the UI
   - Sidebar navigation works (Home / Settings)
   - Type in prompt area → text appears
   - Click Generate → mock AI response appears
   - Click mic button → recording indicator shows (requires mic permission)
   - Settings page shows provider dropdowns and API key inputs
3. Close app → reopen → verify settings persist (config saved via electron-store)
