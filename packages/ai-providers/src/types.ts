// ─── LLMProvider Interface ─────────────────────────────────────────────────

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type FunctionDef = {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export type ChatOptions = {
  temperature?: number
  maxTokens?: number
  functions?: FunctionDef[]
}

export type ChatResult = {
  content: string
  tokensIn: number
  tokensOut: number
  model: string
  latencyMs: number
  functionCall?: {
    name: string
    arguments: Record<string, unknown>
  }
}

export type EmbedResult = {
  embeddings: number[][]
  tokensIn: number
  model: string
}

export interface LLMProvider {
  readonly id: string
  readonly name: string
  readonly type: 'openai' | 'azure_openai' | 'anthropic' | 'grok' | 'gemini'
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult>
  embed(texts: string[]): Promise<EmbedResult>
  countTokens(text: string): number
}

export type ProviderConfig = {
  id: string
  name: string
  type: LLMProvider['type']
  priority: number
  enabled: boolean
  modelChat: string
  modelEmbed?: string
  config: Record<string, string>
}

export type RoutedChatResult = ChatResult & { providerId: string }
export type RoutedEmbedResult = EmbedResult & { providerId: string }
