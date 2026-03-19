import { Zap } from 'lucide-react'
import { useAppStore } from '../store/appStore'

export default function GenerateButton() {
  const { prompt, isGenerating, generate } = useAppStore()

  return (
    <button
      id="generate-button"
      className="btn btn-primary"
      disabled={!prompt.trim() || isGenerating}
      onClick={generate}
    >
      {isGenerating ? (
        <>
          <span className="spinner" />
          Generating...
        </>
      ) : (
        <>
          <Zap size={16} />
          Generate
        </>
      )}
    </button>
  )
}
