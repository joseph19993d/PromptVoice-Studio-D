import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import Sidebar from './components/Sidebar'
import PromptInput from './components/PromptInput'
import MicButton from './components/MicButton'
import GenerateButton from './components/GenerateButton'
import ResultPanel from './components/ResultPanel'
import SettingsPage from './components/SettingsPage'
import SetupWizard from './components/SetupWizard'

export default function App() {
  const { currentPage, loadConfig, showWizard } = useAppStore()

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return (
    <>
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
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
        </main>
      </div>

      {showWizard && <SetupWizard />}
    </>
  )
}
