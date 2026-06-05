/** Tipos dos eventos Bitrix24 recebidos via webhook */

export type BitrixWebhookEvent = {
  event: string
  event_handler_id?: string
  data?: {
    PARAMS?: BitrixIMParams
  }
  auth?: {
    domain?: string
    client_endpoint?: string
    server_endpoint?: string
    member_id?: string
    application_token?: string
  }
}

export type BitrixIMParams = {
  DIALOG_ID?: string
  FROM_USER_ID?: string
  TO_USER_ID?: string
  MESSAGE_ID?: string
  MESSAGE?: string
  TIMESTAMP?: string
  CHAT_TYPE?: 'P' | 'C' | 'O' | 'S'
}

export type BitrixUser = {
  id: string
  name: string
  position?: string
  department?: string
  email?: string
  photoUrl?: string
}

export type SendResult = {
  messageId: string
}
