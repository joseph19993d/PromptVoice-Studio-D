import { useAppStore } from '../store/appStore'

export default function PromptInput() {
  const { prompt, setPrompt } = useAppStore()

  return (
    <div className="prompt-container">
      <textarea
        id="prompt-textarea"
        className="prompt-textarea"
        placeholder="Write your prompt here, or use the mic to speak..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          // Ctrl+Enter to generate
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            useAppStore.getState().generate()
          }
        }}
      />
      <div className="prompt-actions">
        <div className="prompt-actions-left">
          <span className="char-count">{prompt.length} characters</span>
        </div>
      </div>
    </div>
  )
}
