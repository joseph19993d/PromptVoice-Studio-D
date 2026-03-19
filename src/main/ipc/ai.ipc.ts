import { ipcMain } from 'electron'
import { IPC_CHANNELS, AIGenerateOptions } from '../../core/types'
import { AIManager } from '../../core/ai/aiManager'

export function registerAIHandlers(aiManager: AIManager): void {
  ipcMain.handle(
    IPC_CHANNELS.AI_GENERATE,
    async (_event, prompt: string, options?: AIGenerateOptions) => {
      try {
        return { success: true, data: await aiManager.generate(prompt, options) }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.AI_MODELS, async () => {
    try {
      return { success: true, data: await aiManager.listModels() }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
