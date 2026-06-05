import { createHash } from 'crypto'

/** Hash SHA-256 de uma string (hex) */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

/** Normaliza texto para comparação (lowercase, sem espaços duplos) */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Trunca texto com reticências */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/** Formata data pt-BR */
export function formatDateBR(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Sleep promise */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Chunks de array em batches */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}
