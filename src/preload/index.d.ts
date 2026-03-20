import { ElectronAPI } from './index'

declare global {
  interface Window {
    api: ElectronAPI & {
      onDebugLog: (callback: (log: { time: string; level: string; message: string }) => void) => void
    }
  }
}
