// ============================================
// KeyVault — AES-256-GCM Encrypted API Key Storage
// ============================================
// Keys are encrypted with AES-256-GCM using a machine-derived key.
// Stored in a separate JSON file in the app's userData directory.
// Each key entry includes: encrypted data, IV, auth tag, and a hash for integrity.

import { app } from 'electron'
import { createCipheriv, createDecipheriv, randomBytes, createHash, scryptSync } from 'crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'

// ─── Types ─────────────────────────────────────

interface EncryptedEntry {
  data: string      // hex-encoded encrypted data
  iv: string        // hex-encoded initialization vector
  tag: string       // hex-encoded auth tag (GCM)
  hash: string      // SHA-256 hash of the original key (for integrity check)
  updatedAt: number  // timestamp
}

interface VaultData {
  version: number
  entries: Record<string, EncryptedEntry>
}

export type VaultKeyName = 'openrouter' | 'elevenlabs' | 'whisper' | 'ollama_url'

// ─── Key Derivation ────────────────────────────

function getMasterKey(): Buffer {
  // Derive a 32-byte key from a combination of:
  // 1. App-specific salt
  // 2. Machine-specific userData path (unique per user/machine)
  const salt = 'promptvoice-studio-vault-v1'
  const machineId = app.getPath('userData')
  const passphrase = `${salt}::${machineId}`

  return scryptSync(passphrase, salt, 32)
}

// ─── Vault File Path ───────────────────────────

function getVaultPath(): string {
  const userDataPath = app.getPath('userData')
  const vaultDir = path.join(userDataPath, 'vault')

  if (!existsSync(vaultDir)) {
    mkdirSync(vaultDir, { recursive: true })
  }

  return path.join(vaultDir, 'keys.vault.json')
}

// ─── Read / Write Vault ────────────────────────

function readVault(): VaultData {
  const vaultPath = getVaultPath()

  if (!existsSync(vaultPath)) {
    return { version: 1, entries: {} }
  }

  try {
    const raw = readFileSync(vaultPath, 'utf-8')
    return JSON.parse(raw) as VaultData
  } catch {
    return { version: 1, entries: {} }
  }
}

function writeVault(vault: VaultData): void {
  const vaultPath = getVaultPath()
  writeFileSync(vaultPath, JSON.stringify(vault, null, 2), 'utf-8')
}

// ─── Encryption / Decryption ───────────────────

function encryptValue(plaintext: string): EncryptedEntry {
  const masterKey = getMasterKey()
  const iv = randomBytes(16)

  const cipher = createCipheriv('aes-256-gcm', masterKey, iv)
  let encrypted = cipher.update(plaintext, 'utf-8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  const hash = createHash('sha256').update(plaintext).digest('hex')

  return {
    data: encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    hash,
    updatedAt: Date.now()
  }
}

function decryptValue(entry: EncryptedEntry): string {
  const masterKey = getMasterKey()
  const iv = Buffer.from(entry.iv, 'hex')
  const tag = Buffer.from(entry.tag, 'hex')

  const decipher = createDecipheriv('aes-256-gcm', masterKey, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(entry.data, 'hex', 'utf-8')
  decrypted += decipher.final('utf-8')

  // Integrity check
  const hash = createHash('sha256').update(decrypted).digest('hex')
  if (hash !== entry.hash) {
    throw new Error('Key integrity check failed — data may be corrupted')
  }

  return decrypted
}

// ─── Public API ────────────────────────────────

export class KeyVault {
  /** Store an API key securely (encrypted + hashed) */
  static setKey(name: VaultKeyName, value: string): void {
    const vault = readVault()

    if (!value || value.trim() === '') {
      // Remove key if empty
      delete vault.entries[name]
    } else {
      vault.entries[name] = encryptValue(value.trim())
    }

    writeVault(vault)
  }

  /** Retrieve a decrypted API key */
  static getKey(name: VaultKeyName): string | null {
    const vault = readVault()
    const entry = vault.entries[name]

    if (!entry) return null

    try {
      return decryptValue(entry)
    } catch (err) {
      console.error(`[KeyVault] Failed to decrypt key "${name}":`, err)
      return null
    }
  }

  /** Check if a key exists (without decrypting) */
  static hasKey(name: VaultKeyName): boolean {
    const vault = readVault()
    return name in vault.entries
  }

  /** Remove a specific key */
  static removeKey(name: VaultKeyName): void {
    const vault = readVault()
    delete vault.entries[name]
    writeVault(vault)
  }

  /** Get a masked version of the key for display (e.g., "sk-or-...a3f2") */
  static getMaskedKey(name: VaultKeyName): string | null {
    const key = KeyVault.getKey(name)
    if (!key) return null

    if (key.length <= 8) return '••••••••'

    const prefix = key.slice(0, 5)
    const suffix = key.slice(-4)
    return `${prefix}${'•'.repeat(Math.min(key.length - 9, 20))}${suffix}`
  }

  /** Get status of all keys */
  static getAllKeyStatus(): Record<VaultKeyName, { exists: boolean; masked: string | null; updatedAt: number | null }> {
    const vault = readVault()
    const names: VaultKeyName[] = ['openrouter', 'elevenlabs', 'whisper', 'ollama_url']

    const result: Record<string, { exists: boolean; masked: string | null; updatedAt: number | null }> = {}

    for (const name of names) {
      const entry = vault.entries[name]
      result[name] = {
        exists: !!entry,
        masked: entry ? KeyVault.getMaskedKey(name) : null,
        updatedAt: entry?.updatedAt || null
      }
    }

    return result as Record<VaultKeyName, { exists: boolean; masked: string | null; updatedAt: number | null }>
  }

  /** Clear all keys */
  static clearAll(): void {
    writeVault({ version: 1, entries: {} })
  }
}
