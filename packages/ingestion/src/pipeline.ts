import { db } from '@sofia/db'
import { parseAndChunk } from './parsers.js'
import type { ProviderRouter } from '@sofia/ai-providers'

const BATCH_SIZE = 50 // Embeddings por batch

export async function ingestDocument(
  documentId: string,
  router: ProviderRouter
): Promise<void> {
  // 1. Busca o documento
  const { data: doc, error } = await db
    .from('knowledge_documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (error || !doc) throw new Error(`Document not found: ${documentId}`)

  // 2. Atualiza status para 'processing'
  await db
    .from('knowledge_documents')
    .update({ status: 'processing', error_msg: null, updated_at: new Date().toISOString() })
    .eq('id', documentId)

  try {
    let fileData: Buffer | string

    if (doc.source_type === 'url') {
      fileData = doc.source_uri!
    } else {
      // Baixa do Supabase Storage
      const { data: fileBytes, error: downloadError } = await db.storage
        .from('knowledge-documents')
        .download(doc.source_uri!)

      if (downloadError || !fileBytes) {
        throw new Error(`Storage download failed: ${downloadError?.message}`)
      }
      fileData = Buffer.from(await fileBytes.arrayBuffer())
    }

    // 3. Parse + chunk
    const chunks = await parseAndChunk(
      doc.source_type as 'pdf' | 'docx' | 'pptx' | 'txt' | 'url' | 'csv',
      fileData,
      doc.title
    )

    if (chunks.length === 0) {
      throw new Error('No chunks extracted — document may be empty or unreadable')
    }

    // 4. Remove chunks antigos da versão anterior
    await db
      .from('knowledge_chunks')
      .delete()
      .eq('document_id', documentId)
      .lt('version', doc.version)

    // 5. Gera embeddings em batches e insere
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE)
      const texts = batch.map((c) => c.content)

      const embedResult = await router.embed(texts)

      const rows = batch.map((chunk, j) => ({
        document_id: documentId,
        content: chunk.content,
        embedding: embedResult.embeddings[j] ?? null,
        metadata: chunk.metadata as never,
        version: doc.version,
        effective_date: doc.effective_date,
        expires_at: doc.expires_at,
      }))

      const { error: insertError } = await db.from('knowledge_chunks').insert(rows)
      if (insertError) throw new Error(`Chunk insert failed: ${insertError.message}`)
    }

    // 6. Marca como processado
    await db
      .from('knowledge_documents')
      .update({ status: 'processed', updated_at: new Date().toISOString() })
      .eq('id', documentId)

    console.log(`✅ Document "${doc.title}" ingested: ${chunks.length} chunks`)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)

    await db
      .from('knowledge_documents')
      .update({ status: 'failed', error_msg: errMsg, updated_at: new Date().toISOString() })
      .eq('id', documentId)

    throw err
  }
}
