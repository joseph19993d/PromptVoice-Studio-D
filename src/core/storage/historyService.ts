import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'
import { HistoryEntry } from '../types'

const getHistoryPath = (): string => {
  const userDataPath = app.getPath('userData')
  const storagePath = path.join(userDataPath, 'storage')

  if (!existsSync(storagePath)) {
    mkdirSync(storagePath, { recursive: true })
  }

  return path.join(storagePath, 'history.json')
}

export class HistoryService {
  static getHistory(): HistoryEntry[] {
    try {
      const filePath = getHistoryPath()
      if (!existsSync(filePath)) {
        return []
      }
      const data = readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  static addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry {
    const history = HistoryService.getHistory()

    const newEntry: HistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now()
    }

    history.unshift(newEntry) // newest first

    // Keep max 100 entries
    if (history.length > 100) {
      history.splice(100)
    }

    writeFileSync(getHistoryPath(), JSON.stringify(history, null, 2), 'utf-8')
    return newEntry
  }

  static clearHistory(): void {
    writeFileSync(getHistoryPath(), '[]', 'utf-8')
  }
}
