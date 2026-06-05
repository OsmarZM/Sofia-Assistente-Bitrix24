import type { FastifyInstance } from 'fastify'

export async function healthRoute(app: FastifyInstance) {
  app.get('/health', async () => ({
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  }))
}
