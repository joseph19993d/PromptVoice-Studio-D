import { Mic, MicOff } from 'lucide-react'
import { useRecorder } from '../hooks/useRecorder'

export default function MicButton() {
  const { start, stop, isRecording } = useRecorder()

  return (
    <button
      id="mic-button"
      className={`mic-btn ${isRecording ? 'recording' : ''}`}
      onMouseDown={start}
      onMouseUp={stop}
      onMouseLeave={() => { if (isRecording) stop() }}
      title={isRecording ? 'Release to stop recording' : 'Hold to speak'}
    >
      {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  )
}
