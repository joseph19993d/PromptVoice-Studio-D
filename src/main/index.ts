import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { AIManager } from '../core/ai/aiManager'
import { TTSManager } from '../core/tts/ttsManager'
import { STTManager } from '../core/stt/sttManager'
import { ConfigService } from '../core/storage/configService'
import { registerAIHandlers } from './ipc/ai.ipc'
import { registerTTSHandlers } from './ipc/tts.ipc'
import { registerSTTHandlers } from './ipc/stt.ipc'
import { registerConfigHandlers } from './ipc/config.ipc'
import { registerVaultHandlers } from './ipc/vault.ipc'
import { AppConfig } from '../core/types'

// ─── Debug Log Forwarding ──────────────────────

const originalConsoleLog = console.log
const originalConsoleError = console.error

function sendLogToRenderer(level: string, ...args: any[]): void {
  // Only forward if debug view is enabled via env
  if (process.env.VITE_ENABLE_DEBUG_VIEW !== 'true') return;
  
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')
  const win = BrowserWindow.getAllWindows()[0]
  if (win && !win.isDestroyed()) {
    win.webContents.send('debug:log', { time: new Date().toISOString(), level, message: msg })
  }
}

console.log = (...args) => {
  originalConsoleLog(...args)
  sendLogToRenderer('info', ...args)
}
console.error = (...args) => {
  originalConsoleError(...args)
  sendLogToRenderer('error', ...args)
}

// ─── Managers (initialized from saved config) ──

let aiManager: AIManager
let ttsManager: TTSManager
let sttManager: STTManager

function initializeManagers(config: AppConfig): void {
  const { providers, keys } = config

  aiManager = new AIManager(
    providers.ai.provider,
    keys.openrouter,
    keys.ollama_url
  )

  ttsManager = new TTSManager(
    providers.tts.provider,
    keys.elevenlabs
  )

  sttManager = new STTManager(
    providers.stt.provider,
    keys.whisper
  )

  console.log(`[PromptVoice] AI: ${aiManager.providerName}`)
  console.log(`[PromptVoice] TTS: ${ttsManager.providerName}`)
  console.log(`[PromptVoice] STT: ${sttManager.providerName}`)
}

// ─── Window Creation ───────────────────────────

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0a0f',
      symbolColor: '#a78bfa',
      height: 40
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#0a0a0f'
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // dev → Vite dev server | prod → built files
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── App Lifecycle ─────────────────────────────

app.whenReady().then(() => {
  // 1. Load saved config & init managers
  const config = ConfigService.getConfig()
  initializeManagers(config)

  // 2. Register IPC handlers
  registerAIHandlers(aiManager)
  registerTTSHandlers(ttsManager)
  registerSTTHandlers(sttManager)
  registerVaultHandlers((updatedConfig) => {
    initializeManagers(updatedConfig)
  })
  registerConfigHandlers((updatedConfig) => {
    // Reinitialize managers when config changes
    initializeManagers(updatedConfig)
  })

  // 3. Create window
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
