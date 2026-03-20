# 🎙️ PromptVoice Studio

> **AI-powered desktop app for text generation and voice synthesis.**  
> Speak or type your prompts → Generate AI content → Hear results in natural speech.

<p align="center">
  <img src="https://img.shields.io/badge/Electron-33-47848F?style=flat-square&logo=electron" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/Platform-Windows-0078D6?style=flat-square&logo=windows" />
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧠 **AI Text Generation** | Generate content from prompts using OpenRouter, Ollama (local), or mock providers |
| 🎤 **Voice Input (STT)** | Hold the mic button to speak — your voice is transcribed to text automatically |
| 🔊 **Text-to-Speech (TTS)** | Convert generated text to natural-sounding speech with ElevenLabs or mock audio |
| 🎛️ **Provider System** | Swap AI/TTS/STT providers without code changes. Add your own providers easily |
| 💾 **Persistent Config** | API keys and settings saved locally with encryption via `electron-store` |
| 🎨 **Premium Dark UI** | Glassmorphism panels, gradient accents, micro-animations, custom titlebar |
| 🧙 **Setup Wizard** | First-launch onboarding guides you through configuration step by step |
| 📥 **Audio Export** | Download generated audio files directly from the player |

## 🎯 Workflow

```
🎤 Speak (or type)  →  📝 Prompt  →  🧠 AI generates  →  🔊 TTS speaks  →  📥 Export
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ ([download](https://nodejs.org))
- **Windows 10/11** (primary target, macOS/Linux compatible)

### Install & Run

```bash
# Clone
git clone https://github.com/joseph19993d/PromptVoice-Studio-D.git
cd PromptVoice-Studio-D

# Install dependencies
npm install

# Run in development
npm run dev
```

The Electron app will launch automatically. On first launch, the Setup Wizard will guide you through configuration.

### Build for Production

```bash
npm run build
```

## ⚙️ Configuration

### API Keys (Optional)

The app works out of the box with **mock providers** (no API keys needed). For real AI/voice:

| Provider | Purpose | Get Key |
|----------|---------|---------|
| [OpenRouter](https://openrouter.ai) | AI text generation (free tier available) | openrouter.ai → API Keys |
| [Ollama](https://ollama.ai) | Local AI (fully offline, no key needed) | Install Ollama |
| [ElevenLabs](https://elevenlabs.io) | High-quality TTS | elevenlabs.io → Profile |
| [OpenAI Whisper](https://platform.openai.com) | Speech-to-text | platform.openai.com → API Keys |

Configure via **Settings** page in the app, or copy `.env.example` → `.env`.

## 🏗️ Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full technical architecture.

```
UI (React + Zustand) → IPC Bridge (Electron) → Core Managers → Providers (APIs)
```

**Key design principle:** The UI never calls APIs directly. Everything flows through IPC → Manager → Provider, making providers completely swappable.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Electron 33 + electron-vite |
| **Frontend** | React 18 + TypeScript 5 |
| **State** | Zustand |
| **Build** | Vite 5 |
| **Storage** | electron-store (encrypted) |
| **Icons** | Lucide React |
| **Styling** | Vanilla CSS (dark theme, glassmorphism) |

## 📁 Project Structure

```
src/
├── core/          # Business logic (providers, managers, storage)
├── main/          # Electron main process + IPC handlers
├── preload/       # Electron preload bridge (contextBridge)
└── renderer/      # React frontend (components, hooks, store)
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

## Piper Notes

- The current Piper bootstrap flow is intentionally Windows-first. `npm run dev` and `npm run build` call `scripts/setup-piper.js`, which expects PowerShell and `resources/piper/piper.exe`.
- The ElevenLabs to Piper fallback currently prioritizes availability over fidelity. If ElevenLabs fails and TTS falls back to Piper, the app does not yet forward the user's configured Piper-specific tuning values during that fallback path.
