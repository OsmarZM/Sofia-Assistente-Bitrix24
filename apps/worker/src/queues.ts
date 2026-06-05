import { Redis } from 'ioredis'
import { Queue, Worker, type Processor } from 'bullmq'

const REDIS_HOST = process.env['REDIS_HOST'] ?? 'localhost'
const REDIS_PORT = parseInt(process.env['REDIS_PORT'] ?? '6379')
const REDIS_PASSWORD = process.env['REDIS_PASSWORD']

export const redisConnection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
}

export const redis = new Redis({
  ...redisConnection,
  maxRetriesPerRequest: null, // necessário para BullMQ
})

/** Cria um worker tipado */
export function createWorker<T>(name: string, processor: Processor<T>) {
  return new Worker<T>(name, processor, {
    connection: { ...redisConnection },
    concurrency: parseInt(process.env['WORKER_CONCURRENCY'] ?? '5'),
  })
}

/** Queue declarations (compartilhadas com apps/api) */
export const bitrixMessageQueue = new Queue('bitrix-message', { connection: redisConnection })
export const ingestQueue = new Queue('ingest', { connection: redisConnection })
export const profileQueue = new Queue('profile', { connection: redisConnection })
export const recalibrateQueue = new Queue('recalibrate', { connection: redisConnection })
