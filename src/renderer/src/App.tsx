import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import Sidebar from './components/Sidebar'
import PromptInput from './components/PromptInput'
import MicButton from './components/MicButton'
import GenerateButton from './components/GenerateButton'
import ResultPanel from './components/ResultPanel'
import SettingsPage from './components/SettingsPage'
import SetupWizard from './components/SetupWizard'
import DebugPage from './components/DebugPage'
import { AlertCircle } from 'lucide-react'

export default function App() {
  const { currentPage, loadConfig, showWizard, appError } = useAppStore()

  useEffect(() => {
    loadConfig()

    const isDebugEnabled = import.meta.env.VITE_ENABLE_DEBUG_VIEW === 'true'
    if (isDebugEnabled) {
      // Listen to main process logs
      window.api.onDebugLog((log) => {
        useAppStore.getState().addDebugLog(log.level, `[MAIN] ${log.message}`)
      })

      // Intercept renderer logs
      const originalLog = console.log
      const originalError = console.error
      const originalWarn = console.warn

      console.log = (...args) => {
        originalLog(...args)
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')
        useAppStore.getState().addDebugLog('info', `[UI] ${msg}`)
      }
      console.error = (...args) => {
        originalError(...args)
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')
        useAppStore.getState().addDebugLog('error', `[UI] ${msg}`)
      }
      console.warn = (...args) => {
        originalWarn(...args)
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')
        useAppStore.getState().addDebugLog('warn', `[UI] ${msg}`)
      }
    }
  }, [loadConfig])

  return (
    <>
      <div className="titlebar-drag-region" />
      <div className="app-layout">
        <Sidebar />

        <main className="main-content" style={{ position: 'relative' }}>
          {/* Global Error Banner */}
          {appError && (
            <div className="fade-in" style={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              zIndex: 100,
              maxWidth: '80%',
              fontWeight: 500
            }}>
              <AlertCircle size={20} />
              {appError}
            </div>
          )}

          {currentPage === 'home' && (
            <>
              <div className="main-header">
                <h2>✨ Generate</h2>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <PromptInput />
                </div>
                <MicButton />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <GenerateButton />
              </div>

              <ResultPanel />
            </>
          )}

          {currentPage === 'settings' && (
            <>
              <div className="main-header">
                <h2>⚙️ Settings</h2>
              </div>
              <SettingsPage />
            </>
          )}

          {currentPage === 'debug' && (
            <DebugPage />
          )}
        </main>
      </div>

      {showWizard && <SetupWizard />}
    </>
  )
}
