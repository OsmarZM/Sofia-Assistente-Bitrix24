import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { healthRoute } from './routes/health.js'
import { bitrixWebhookRoute } from './routes/webhooks/bitrix.js'
import { adminDocumentsRoute } from './routes/admin/documents.js'
import { adminChatRoute } from './routes/admin/chat.js'
import { adminSuggestionsRoute } from './routes/admin/suggestions.js'
import { adminDashboardRoute } from './routes/admin/dashboard.js'
import { adminProvidersRoute } from './routes/admin/providers.js'
import { adminUsersRoute } from './routes/admin/users.js'

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
      transport:
        process.env['NODE_ENV'] === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    genReqId: () => crypto.randomUUID(),
    requestIdLogLabel: 'reqId',
  })

  // CORS
  app.register(cors, {
    origin: process.env['ADMIN_ORIGIN'] ?? 'http://localhost:3000',
    credentials: true,
  })

  // Rate limit global: 100 req/10s por IP
  app.register(rateLimit, {
    max: 100,
    timeWindow: '10 seconds',
  })

  // Routes
  app.register(healthRoute)
  app.register(bitrixWebhookRoute, { prefix: '/webhooks' })
  app.register(adminDocumentsRoute, { prefix: '/admin' })
  app.register(adminChatRoute, { prefix: '/admin' })
  app.register(adminSuggestionsRoute, { prefix: '/admin' })
  app.register(adminDashboardRoute, { prefix: '/admin' })
  app.register(adminProvidersRoute, { prefix: '/admin' })
  app.register(adminUsersRoute, { prefix: '/admin' })

  return app
}
