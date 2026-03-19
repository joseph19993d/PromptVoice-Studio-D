import { ipcMain } from 'electron'
import { IPC_CHANNELS, AppConfig, APIKeys } from '../../core/types'
import { ConfigService } from '../../core/storage/configService'
import { HistoryService } from '../../core/storage/historyService'

export function registerConfigHandlers(
  onConfigChange: (config: AppConfig) => void
): void {
  // ─── Config ─────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, () => {
    try {
      return { success: true, data: ConfigService.getConfig() }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(
    IPC_CHANNELS.CONFIG_SET,
    (_event, config: Partial<AppConfig>) => {
      try {
        const updated = ConfigService.setConfig(config)
        onConfigChange(updated) // Notify main process to reinitialize managers
        return { success: true, data: updated }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CONFIG_GET_KEY,
    (_event, provider: keyof APIKeys) => {
      try {
        return { success: true, data: ConfigService.getAPIKey(provider) }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CONFIG_SET_KEY,
    (_event, provider: keyof APIKeys, key: string) => {
      try {
        ConfigService.setAPIKey(provider, key)
        // Trigger config change to update providers
        onConfigChange(ConfigService.getConfig())
        return { success: true }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  // ─── History ────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.HISTORY_GET, () => {
    try {
      return { success: true, data: HistoryService.getHistory() }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(
    IPC_CHANNELS.HISTORY_ADD,
    (_event, entry: { prompt: string; result: string; provider: string; model?: string }) => {
      try {
        const newEntry = HistoryService.addEntry(entry)
        return { success: true, data: newEntry }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, () => {
    try {
      HistoryService.clearHistory()
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
