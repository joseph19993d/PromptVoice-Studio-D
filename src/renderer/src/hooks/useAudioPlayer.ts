import { useRef, useCallback, useState, useEffect } from 'react'

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const loadAudio = useCallback((base64Data: string, autoPlay: boolean = false) => {
    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause()
      // We no longer need revokeObjectURL since we are using data: URIs
    }

    let mimeType = 'audio/mpeg'
    if (base64Data.startsWith('UklGR')) {
      mimeType = 'audio/wav'
    } else if (base64Data.startsWith('T2dnUw')) {
      mimeType = 'audio/ogg'
    }

    console.log(`[AudioPlayer] Validating Base64 Stream...
- MimeDetect: ${mimeType} 
- HeadBytes: ${base64Data.substring(0, 20)}
- StreamLen: ${base64Data.length}`)

    // Usar Blob para respetar la Política de Seguridad de Contenido (CSP) de Electron
    // y evitar los bloqueos "rejected by URL safety check" de los URIs "data:".
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const audio = new Audio(url)
    audioRef.current = audio

    audio.onloadedmetadata = () => {
      setDuration(audio.duration)
    }

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime)
    }

    audio.onended = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.onerror = (e) => {
      console.error('[AudioPlayer] Audio playback error:', audio.error?.message || e)
      setIsPlaying(false)
    }

    if (autoPlay) {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error(`[AudioPlayer] AutoPlay blocked: ${err.message || err.name || 'Unknown Error'}`, err)
        })
    }
  }, [])

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  return {
    loadAudio,
    play,
    pause,
    togglePlay,
    seek,
    isPlaying,
    currentTime,
    duration,
    formatTime,
    hasAudio: audioRef.current !== null
  }
}
