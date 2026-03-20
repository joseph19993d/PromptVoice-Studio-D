import { Copy, Volume2, Sparkles } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import AudioPlayer from './AudioPlayer'
import FloatingVoiceSettings from './FloatingVoiceSettings'

export default function ResultPanel() {
  const { result, setResult, isGenerating, generateAndSpeak } = useAppStore()

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result)
    }
  }

  return (
    <div className="result-panel">
      <div className="result-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3>✨ Result</h3>
          <FloatingVoiceSettings />
        </div>
        {result && (
          <div className="result-actions">
            <button
              id="copy-result-btn"
              className="btn-icon"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              <Copy size={16} />
            </button>
            <button
              id="speak-result-btn"
              className="btn-icon"
              onClick={generateAndSpeak}
              title="Read aloud"
            >
              <Volume2 size={16} />
            </button>
          </div>
        )}
      </div>

      {result ? (
        <textarea
          id="result-textarea"
          className="result-text result-editable fade-in"
          value={result}
          onChange={(e) => setResult(e.target.value)}
          spellCheck={false}
        />
      ) : (
        <div className="result-empty">
          <div className="result-empty-icon">
            <Sparkles size={48} strokeWidth={1} />
          </div>
          <p>{isGenerating ? 'Generating...' : 'Your generated content will appear here'}</p>
          <p style={{ fontSize: 13, opacity: 0.6 }}>
            Type a prompt or hold 🎤 to speak, then click Generate
          </p>
        </div>
      )}

      <AudioPlayer />
    </div>
  )
}
