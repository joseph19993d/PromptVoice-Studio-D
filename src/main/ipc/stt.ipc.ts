import { ipcMain } from 'electron'
import { IPC_CHANNELS, STTOptions } from '../../core/types'
import { STTManager } from '../../core/stt/sttManager'

export function registerSTTHandlers(getSTTManager: () => STTManager): void {
  ipcMain.handle(
    IPC_CHANNELS.STT_TRANSCRIBE,
    async (_event, audioBase64: string, options?: STTOptions) => {
      try {
        // Convert base64 back to Buffer
        const audioBuffer = Buffer.from(audioBase64, 'base64')
        const text = await getSTTManager().transcribe(audioBuffer, options)
        return { success: true, data: text }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )
}
