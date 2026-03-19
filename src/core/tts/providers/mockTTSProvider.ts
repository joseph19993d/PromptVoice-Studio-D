import { ITTSProvider, TTSOptions, VoiceInfo } from '../../types'

export class MockTTSProvider implements ITTSProvider {
  readonly name = 'mock'

  async generateAudio(_text: string, _options?: TTSOptions): Promise<Buffer> {
    // Simulate delay
    await new Promise((r) => setTimeout(r, 300))

    // Return a minimal valid WAV file header (silence) for testing
    // 44-byte WAV header + 8000 samples of silence (16-bit mono, 8kHz, ~1 second)
    const sampleRate = 8000
    const numSamples = sampleRate // 1 second
    const dataSize = numSamples * 2 // 16-bit = 2 bytes per sample
    const fileSize = 36 + dataSize

    const buffer = Buffer.alloc(44 + dataSize)

    // RIFF header
    buffer.write('RIFF', 0)
    buffer.writeUInt32LE(fileSize, 4)
    buffer.write('WAVE', 8)

    // fmt sub-chunk
    buffer.write('fmt ', 12)
    buffer.writeUInt32LE(16, 16) // sub-chunk size
    buffer.writeUInt16LE(1, 20) // PCM format
    buffer.writeUInt16LE(1, 22) // mono
    buffer.writeUInt32LE(sampleRate, 24)
    buffer.writeUInt32LE(sampleRate * 2, 28) // byte rate
    buffer.writeUInt16LE(2, 32) // block align
    buffer.writeUInt16LE(16, 34) // bits per sample

    // data sub-chunk
    buffer.write('data', 36)
    buffer.writeUInt32LE(dataSize, 40)
    // Data is already zeroed (silence)

    return buffer
  }

  async listVoices(): Promise<VoiceInfo[]> {
    return [
      { id: 'mock-voice-1', name: 'Mock Voice (Silent)' }
    ]
  }
}
