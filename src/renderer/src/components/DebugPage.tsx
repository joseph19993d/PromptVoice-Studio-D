import { useRef, useEffect } from 'react'
import { Terminal, Trash2, Copy, Check } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useState } from 'react'

export default function DebugPage() {
  const { debugLogs, clearDebugLogs } = useAppStore()
  const endRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [debugLogs])

  const copyLogs = () => {
    const text = debugLogs
      .map((l) => `[${new Date(l.time).toLocaleTimeString()}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="debug-page fade-in" style={{
      display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 20 }}>
          <Terminal size={20} /> Developer Debug View
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={copyLogs} disabled={debugLogs.length === 0}>
            {copied ? <Check size={16} /> : <Copy size={16} />} Copy All
          </button>
          <button className="btn btn-ghost" onClick={clearDebugLogs} disabled={debugLogs.length === 0}>
            <Trash2 size={16} /> Clear Logs
          </button>
        </div>
      </div>

      <div style={{
        flex: 1,
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 16,
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: 13,
        lineHeight: 1.5,
        color: '#e2e8f0'
      }}>
        {debugLogs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>
            No logs recorded yet. Run some actions to see traces.
          </div>
        ) : (
          debugLogs.map((log, i) => (
            <div key={i} style={{
              marginBottom: 4,
              padding: '2px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              wordBreak: 'break-all'
            }}>
              <span style={{ color: '#64748b' }}>[{new Date(log.time).toLocaleTimeString()}]</span>{' '}
              <span style={{
                color: log.level === 'error' ? '#f87171' : log.level === 'warn' ? '#fbbf24' : '#60a5fa'
              }}>
                [{log.level.toUpperCase()}]
              </span>{' '}
              {log.message}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}
