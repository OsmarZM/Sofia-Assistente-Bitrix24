import crypto from 'node:crypto'
import { db } from '@sofia/db'

type CacheHit = {
  response: string
  sources: unknown
  tokensIn: number
  tokensOut: number
  costUsd: number
}

function hashQuery(question: string): string {
  return crypto.createHash('sha256').update(question.toLowerCase().trim()).digest('hex')
}

function hashChunks(chunkIds: string[]): string {
  return crypto
    .createHash('sha256')
    .update([...chunkIds].sort().join(','))
    .digest('hex')
}

export async function getCachedResponse(
  question: string,
  chunkIds: string[]
): Promise<CacheHit | null> {
  const queryHash = hashQuery(question)
  const chunkIdsHash = hashChunks(chunkIds)

  const { data } = await db
    .from('response_cache')
    .select('response, sources, tokens_in, tokens_out, cost_usd')
    .eq('query_hash', queryHash)
    .eq('chunk_ids_hash', chunkIdsHash)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data) return null

  return {
    response: data.response,
    sources: data.sources,
    tokensIn: data.tokens_in ?? 0,
    tokensOut: data.tokens_out ?? 0,
    costUsd: 0, // Cache hit = custo zero
  }
}

export async function setCachedResponse(
  question: string,
  chunkIds: string[],
  response: string,
  sources: unknown,
  providerId: string,
  tokensIn: number,
  tokensOut: number,
  costUsd: number,
  ttlHours = 1
): Promise<void> {
  const queryHash = hashQuery(question)
  const chunkIdsHash = hashChunks(chunkIds)
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString()

  await db
    .from('response_cache')
    .upsert(
      {
        query_hash: queryHash,
        chunk_ids_hash: chunkIdsHash,
        response,
        sources: sources as never,
        provider_used: providerId,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_usd: costUsd,
        expires_at: expiresAt,
      },
      { onConflict: 'query_hash,chunk_ids_hash' }
    )
    .catch(() => {
      // Cache write failure nunca deve quebrar o fluxo
    })
}
