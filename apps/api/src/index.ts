import { buildApp } from './app.js'

const PORT = parseInt(process.env['API_PORT'] ?? '3001')
const HOST = process.env['API_HOST'] ?? '0.0.0.0'

const app = buildApp()

try {
  await app.listen({ port: PORT, host: HOST })
  console.log(`🚀 Sofia API running at http://${HOST}:${PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
