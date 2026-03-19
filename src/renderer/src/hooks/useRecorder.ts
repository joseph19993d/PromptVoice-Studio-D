import { useRef, useCallback } from 'react'
import { useAppStore } from '../store/appStore'

export function useRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const { isRecording, setIsRecording, setPrompt } = useAppStore()

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      })

      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        // Stop all tracks
        streamRef.current?.getTracks().forEach((t) => t.stop())

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })

        // Convert to base64 for IPC transport
        const arrayBuffer = await blob.arrayBuffer()
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        )

        try {
          const transcription = await window.api.transcribe(base64)
          setPrompt(transcription)
        } catch (err) {
          console.error('Transcription error:', err)
        }
      }

      recorder.start(250) // collect data every 250ms
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone access error:', err)
    }
  }, [setIsRecording, setPrompt])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [setIsRecording])

  return { start, stop, isRecording }
}
