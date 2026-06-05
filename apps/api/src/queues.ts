import { Queue } from 'bullmq'

const connection = {
  host: process.env['REDIS_HOST'] ?? 'localhost',
  port: parseInt(process.env['REDIS_PORT'] ?? '6379'),
  ...(process.env['REDIS_PASSWORD'] ? { password: process.env['REDIS_PASSWORD'] } : {}),
}

export const bitrixMessageQueue = new Queue('bitrix-message', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 500,
  },
})

export const ingestQueue = new Queue('ingest', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 200,
    removeOnFail: 100,
  },
})

export const profileQueue = new Queue('profile', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: 100,
    removeOnFail: 50,
  },
})
