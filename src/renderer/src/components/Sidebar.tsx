import { Home, Settings, Mic, Brain, Volume2, Terminal } from 'lucide-react'
import { useAppStore, Page } from '../store/appStore'

export default function Sidebar() {
  const { currentPage, setPage, config } = useAppStore()

  const navItems: { id: Page; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Studio', icon: Home },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  if (import.meta.env.VITE_ENABLE_DEBUG_VIEW === 'true') {
    navItems.push({ id: 'debug', label: 'Dev View', icon: Terminal as any })
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🎙️</div>
        <h1>PromptVoice</h1>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`sidebar-nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Status indicators */}
      <div className="sidebar-status">
        <div className="sidebar-status-item">
          <span className={`status-dot ${config?.ai?.provider !== 'mock' ? 'connected' : ''}`} />
          <Brain size={12} />
          <span>AI: {config?.ai?.provider || 'mock'}</span>
        </div>
        <div className="sidebar-status-item">
          <span className={`status-dot ${config?.tts?.provider !== 'mock' ? 'connected' : ''}`} />
          <Volume2 size={12} />
          <span>TTS: {config?.tts?.provider || 'mock'}</span>
        </div>
        <div className="sidebar-status-item">
          <span className={`status-dot ${config?.stt?.provider !== 'mock' ? 'connected' : ''}`} />
          <Mic size={12} />
          <span>STT: {config?.stt?.provider || 'mock'}</span>
        </div>
      </div>
    </aside>
  )
}
