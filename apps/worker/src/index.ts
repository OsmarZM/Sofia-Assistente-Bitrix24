import { Queue } from 'bullmq'
import { redisConnection } from './queues.js'
import { createBitrixMessageWorker } from './jobs/bitrix-message.js'
import { createIngestWorker } from './jobs/ingest.js'
import { createProfileWorker } from './jobs/profile-update.js'
import { createPhaseWatcherWorker } from './jobs/phase-watcher.js'
import { createAlertWatcherWorker } from './jobs/alert-watcher.js'
import { createRecalibrateWorker } from './jobs/recalibrate-threshold.js'

// ── Workers ──────────────────────────────────────────────────────────────────
const bitrixWorker = createBitrixMessageWorker()
const ingestWorker = createIngestWorker()
const profileWorker = createProfileWorker()
const phaseWatcherWorker = createPhaseWatcherWorker()
const alertWatcherWorker = createAlertWatcherWorker()
const recalibrateWorker = createRecalibrateWorker()

console.log('🔧 Sofia Worker started — all workers active')

// ── Crons ────────────────────────────────────────────────────────────────────
// BullMQ não tem Queue.add com repeat fora de uma Queue separada; usamos scheduleRepeat

const phaseWatcherQueue = new Queue('phase-watcher', { connection: redisConnection })
const alertWatcherQueue = new Queue('alert-watcher', { connection: redisConnection })

// Phase watcher: a cada 1 minuto
await phaseWatcherQueue.add(
  'tick',
  { tick: 1 },
  { repeat: { every: 60_000 }, jobId: 'phase-watcher-cron' }
)

// Alert watcher: a cada 5 minutos
await alertWatcherQueue.add(
  'tick',
  { tick: 1 },
  { repeat: { every: 5 * 60_000 }, jobId: 'alert-watcher-cron' }
)

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown() {
  console.log('🛑 Shutting down workers...')
  await Promise.all([
    bitrixWorker.close(),
    ingestWorker.close(),
    profileWorker.close(),
    phaseWatcherWorker.close(),
    alertWatcherWorker.close(),
    recalibrateWorker.close(),
  ])
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// ── Error handling ────────────────────────────────────────────────────────────
for (const worker of [bitrixWorker, ingestWorker, profileWorker, phaseWatcherWorker, alertWatcherWorker, recalibrateWorker]) {
  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.name} [${job?.id}] failed:`, err.message)
  })
}
