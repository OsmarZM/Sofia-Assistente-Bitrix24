import { db } from '@sofia/db'
import type { ProviderRouter } from '@sofia/ai-providers'

export type RetrievedChunk = {
  id: string
  content: string
  score: number
  documentId: string
  documentTitle: string
  categoryName?: string
  expiresAt: Date | null
  effectiveDate: Date | null
  metadata: Record<string, unknown>
}

export type RetrieveOptions = {
  topK?: number
  categoryId?: string
  includeExpired?: boolean
  expiryPenalty?: number
  minScore?: number
}

export async function retrieve(
  embedding: number[],
  options: RetrieveOptions = {}
): Promise<RetrievedChunk[]> {
  const {
    topK = 6,
    categoryId,
    includeExpired = true,
    expiryPenalty = 0.2,
    minScore = 0.35,
  } = options

  const embeddingStr = `[${embedding.join(',')}]`

  // Busca pgvector com cosine distance
  const { data, error } = await db.rpc('search_knowledge_chunks', {
    query_embedding: embeddingStr,
    match_count: topK * 2,
    category_filter: categoryId ?? null,
  })

  if (error) {
    // Fallback: query simples sem função RPC se ainda não existir
    console.warn('RPC search_knowledge_chunks not found, using raw query')
    return []
  }

  if (!data) return []

  const now = new Date()

  type RawRow = {
    id: string
    content: string
    metadata: Record<string, unknown>
    expires_at: string | null
    effective_date: string | null
    document_id: string
    document_title: string
    category_name: string | null
    distance: number
  }

  return (data as RawRow[])
    .map((row): RetrievedChunk => {
      const isExpired = row.expires_at ? new Date(row.expires_at) < now : false
      const adjustedDistance = isExpired ? row.distance + expiryPenalty : row.distance
      return {
        id: row.id,
        content: row.content,
        score: Math.max(0, 1 - adjustedDistance),
        documentId: row.document_id,
        documentTitle: row.document_title,
        categoryName: row.category_name ?? undefined,
        expiresAt: row.expires_at ? new Date(row.expires_at) : null,
        effectiveDate: row.effective_date ? new Date(row.effective_date) : null,
        metadata: row.metadata ?? {},
      }
    })
    .filter((c) => {
      if (!includeExpired && c.expiresAt && c.expiresAt < now) return false
      return c.score >= minScore
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

/** Gera embedding e recupera chunks em uma chamada */
export async function embedAndRetrieve(
  text: string,
  router: ProviderRouter,
  options?: RetrieveOptions
): Promise<{ chunks: RetrievedChunk[]; embeddingProviderId: string }> {
  const result = await router.embed([text])
  const embedding = result.embeddings[0]
  if (!embedding) throw new Error('Embedding generation returned empty result')

  const chunks = await retrieve(embedding, options)
  return { chunks, embeddingProviderId: result.providerId }
}
