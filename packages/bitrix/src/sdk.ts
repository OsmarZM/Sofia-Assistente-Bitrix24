import type { BitrixUser, SendResult } from './types.js'

const DEGRADED_MSG =
  '🤖 Sofia está temporariamente indisponível. Por favor, tente novamente em alguns minutos.'
const REQUEST_TIMEOUT_MS = 15_000

export class BitrixSDK {
  private readonly webhookUrl: string

  constructor(
    webhookUrl: string,
    readonly sofiaUserId: string
  ) {
    // Normaliza a URL removendo trailing slash
    this.webhookUrl = webhookUrl.replace(/\/$/, '')
  }

  /** Chama um método da API REST do Bitrix24 */
  private async call<T = unknown>(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const url = `${this.webhookUrl}/${method}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      throw new Error(`Bitrix API HTTP error: ${response.status} ${response.statusText}`)
    }

    type ApiResponse = { result?: T; error?: string; error_description?: string }
    const data = (await response.json()) as ApiResponse

    if (data.error) {
      throw new Error(`Bitrix API error: ${data.error} — ${data.error_description ?? ''}`)
    }

    return data.result as T
  }

  /** Envia uma mensagem de texto em um chat do Bitrix24 */
  async sendMessage(chatId: string, text: string): Promise<SendResult> {
    const result = await this.call<{ MESSAGE_ID: string }>('im.message.add', {
      DIALOG_ID: chatId,
      MESSAGE: text,
    })
    return { messageId: result.MESSAGE_ID }
  }

  /** Envia mensagem de degradação (todos os providers IA indisponíveis) */
  async sendDegradedMessage(chatId: string): Promise<void> {
    await this.sendMessage(chatId, DEGRADED_MSG)
  }

  /** Obtém informações do usuário Bitrix24 */
  async getUserInfo(userId: string): Promise<BitrixUser | null> {
    try {
      type RawUser = {
        ID: string
        NAME: string
        LAST_NAME: string
        WORK_POSITION?: string
        EMAIL?: Array<{ VALUE: string }>
        PERSONAL_PHOTO?: string
      }

      const result = await this.call<RawUser>('user.get', {
        ID: userId,
        FIELDS: ['ID', 'NAME', 'LAST_NAME', 'WORK_POSITION', 'EMAIL', 'PERSONAL_PHOTO'],
      })

      if (!result) return null

      return {
        id: result.ID,
        name: `${result.NAME ?? ''} ${result.LAST_NAME ?? ''}`.trim(),
        position: result.WORK_POSITION,
        email: result.EMAIL?.[0]?.VALUE,
        photoUrl: result.PERSONAL_PHOTO,
      }
    } catch {
      return null
    }
  }

  /** Verifica se o userId é a própria Sofia (para evitar loop) */
  isSofia(userId: string): boolean {
    return userId === this.sofiaUserId
  }
}

/** Factory com variáveis de ambiente */
export function buildBitrixSDKFromEnv(): BitrixSDK {
  const webhookUrl = process.env['BITRIX_INBOUND_WEBHOOK']
  const sofiaUserId = process.env['BITRIX_SOFIA_USER_ID']

  if (!webhookUrl) throw new Error('BITRIX_INBOUND_WEBHOOK is required')
  if (!sofiaUserId) throw new Error('BITRIX_SOFIA_USER_ID is required')

  return new BitrixSDK(webhookUrl, sofiaUserId)
}
