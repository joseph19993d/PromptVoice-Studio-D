import { useEffect, useMemo } from 'react'
import { Play, Pause, Download } from 'lucide-react'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import { useAppStore } from '../store/appStore'

export default function AudioPlayer() {
  const { audioBase64 } = useAppStore()
  const {
    loadAudio,
    togglePlay,
    isPlaying,
    currentTime,
    duration,
    formatTime
  } = useAudioPlayer()

  useEffect(() => {
    if (audioBase64) {
      loadAudio(audioBase64)
    }
  }, [audioBase64, loadAudio])

  const bars = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const height = Math.random() * 24 + 4
      const progress = duration > 0 ? currentTime / duration : 0
      const barProgress = i / 40
      return { height, active: barProgress <= progress }
    })
  }, [duration > 0]) // eslint-disable-line

  const handleDownload = () => {
    if (!audioBase64) return
    const binaryString = atob(audioBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `promptvoice-${Date.now()}.mp3`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!audioBase64) return null

  return (
    <div className="audio-player fade-in">
      <button
        id="audio-play-btn"
        className="audio-player-btn"
        onClick={togglePlay}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <div className="audio-waveform">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`audio-waveform-bar ${bar.active ? 'active' : ''}`}
            style={{ height: `${bar.height}px` }}
          />
        ))}
      </div>

      <span className="audio-time">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <button
        id="audio-download-btn"
        className="btn-icon"
        onClick={handleDownload}
        title="Download audio"
      >
        <Download size={16} />
      </button>
    </div>
  )
}
