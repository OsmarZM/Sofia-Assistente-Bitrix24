import type { FastifyInstance } from 'fastify'
import { db } from '@sofia/db'
import { safeEqual, logAuditBackground } from '@sofia/shared'
import { bitrixMessageQueue } from '../../queues.js'
import type { BitrixWebhookEvent } from '@sofia/bitrix'

const OUTGOING_TOKEN = process.env['BITRIX_OUTGOING_TOKEN']
const SOFIA_USER_ID = process.env['BITRIX_SOFIA_USER_ID']

export async function bitrixWebhookRoute(app: FastifyInstance) {
  // Bitrix envia tanto form-encoded quanto JSON
  app.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_, body, done) => {
    try {
      const params = new URLSearchParams(body as string)
      const obj: Record<string, string> = {}
      params.forEach((v, k) => { obj[k] = v })
      done(null, obj)
    } catch (e) {
      done(e as Error)
    }
  })

  app.post<{ Body: BitrixWebhookEvent }>('/bitrix', async (request, reply) => {
    const body = request.body

    // Valida token outgoing em tempo constante (anti-timing attack)
    const receivedToken = body.auth?.application_token ?? ''
    if (OUTGOING_TOKEN && !safeEqual(receivedToken, OUTGOING_TOKEN)) {
      logAuditBackground({
        actor: 'system',
        action: 'webhook_auth_failure',
        entity: 'bitrix_events',
        after: { ip: request.ip, token_prefix: receivedToken.slice(0, 4) },
      })
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const event = body.event
    const params = body.data?.PARAMS

    // Só processa eventos de mensagem IM
    if (
      event !== 'ONIMBOTMESSAGEADD' &&
      event !== 'ONIMMESSAGEADD' &&
      event !== 'ONIMJOINCHAT'
    ) {
      return reply.code(200).send({ ok: true })
    }

    const userId = params?.FROM_USER_ID
    const chatId = params?.DIALOG_ID
    const text = params?.MESSAGE?.trim()

    // Ignora mensagens da própria Sofia (evita loops)
    if (!userId || !chatId || !text || userId === SOFIA_USER_ID) {
      return reply.code(200).send({ ok: true })
    }

    // Persiste o evento bruto
    const { data: eventRow } = await db
      .from('bitrix_events')
      .insert({
        event_type: event,
        payload: body as unknown as Record<string, unknown>,
        processed: false,
      })
      .select('id')
      .single()

    // Enfileira para processamento assíncrono
    if (eventRow) {
      await bitrixMessageQueue.add(
        'process',
        {
          eventId: eventRow.id,
          chatId,
          userId,
          text,
          timestamp: params?.TIMESTAMP ?? new Date().toISOString(),
        },
        { jobId: eventRow.id } // idempotência
      )
    }

    // Responde imediatamente ao Bitrix (deve ser < 3s)
    return reply.code(200).send({ ok: true })
  })
}
