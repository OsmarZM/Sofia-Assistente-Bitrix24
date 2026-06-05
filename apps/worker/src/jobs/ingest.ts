import { createWorker } from '../queues.js'
import { ingestDocument } from '@sofia/ingestion'
import { buildProviderRouterFromEnv } from '@sofia/ai-providers'

type IngestPayload = { documentId: string }

export function createIngestWorker() {
  const router = buildProviderRouterFromEnv()

  return createWorker<IngestPayload>('ingest', async (job) => {
    await ingestDocument(job.data.documentId, router)
  })
}
