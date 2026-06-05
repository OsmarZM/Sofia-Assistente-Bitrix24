/**
 * crypto.ts — Cifra/decifra JSON usando AES-256-GCM.
 *
 * Chave: variável CREDENTIAL_ENCRYPTION_KEY (32 bytes base64).
 * Cada cifra gera IV aleatório de 12 bytes + auth tag de 16 bytes.
 * Formato em repouso (base64): <iv:12 bytes><ciphertext><authTag:16 bytes>
 */
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12  // bytes — recomendado para GCM
const TAG_LEN = 16 // bytes

function loadKey(): Buffer {
  const raw = process.env['CREDENTIAL_ENCRYPTION_KEY']
  if (!raw) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY não definida no ambiente')
  }
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    throw new Error(`CREDENTIAL_ENCRYPTION_KEY deve ter 32 bytes em base64 (recebeu ${key.length})`)
  }
  return key
}

/**
 * Cifra um objeto JSON e retorna string base64 pronta para armazenar em DB.
 */
export function encryptJSON(data: Record<string, unknown>): string {
  const key = loadKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const plain = Buffer.from(JSON.stringify(data), 'utf8')
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()])
  const tag = cipher.getAuthTag()
  // Layout: [iv][ciphertext][tag]
  return Buffer.concat([iv, encrypted, tag]).toString('base64')
}

/**
 * Decifra uma string base64 (gerada por encryptJSON) e retorna o objeto original.
 */
export function decryptJSON<T = Record<string, unknown>>(encoded: string): T {
  const key = loadKey()
  const buf = Buffer.from(encoded, 'base64')
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error('Payload cifrado inválido ou truncado')
  }
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(buf.length - TAG_LEN)
  const ciphertext = buf.subarray(IV_LEN, buf.length - TAG_LEN)

  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return JSON.parse(plain.toString('utf8')) as T
}

/**
 * Compara dois valores em tempo constante (anti-timing attack).
 * Use para validar tokens/webhooks.
 */
export function safeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) {
      // Força comparação de tamanho igual para não vazar comprimento
      timingSafeEqual(bufA, bufA)
      return false
    }
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

/**
 * Gera uma nova CREDENTIAL_ENCRYPTION_KEY de 32 bytes (base64).
 * Use no terminal para gerar o valor inicial:
 *   node -e "const c=require('crypto');console.log(c.randomBytes(32).toString('base64'))"
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('base64')
}
