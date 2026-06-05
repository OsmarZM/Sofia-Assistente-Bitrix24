import Anthropic from '@anthropic-ai/sdk'
import type { LLMProvider, ChatMessage, ChatOptions, ChatResult, EmbedResult } from '../types.js'

export class AnthropicProvider implements LLMProvider {
  readonly type = 'anthropic' as const
  private client: Anthropic

  constructor(
    readonly id: string,
    readonly name: string,
    private readonly modelChat: string,
    apiKey: string
  ) {
    this.client = new Anthropic({ apiKey })
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
    const start = Date.now()

    const systemMsg = messages.find((m) => m.role === 'system')?.content
    const userMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const response = await this.client.messages.create({
      model: this.modelChat,
      max_tokens: options.maxTokens ?? 2048,
      system: systemMsg,
      messages: userMessages,
    })

    const block = response.content[0]
    if (!block || block.type !== 'text') throw new Error('No text content returned by Anthropic')

    return {
      content: block.text,
      tokensIn: response.usage.input_tokens,
      tokensOut: response.usage.output_tokens,
      model: response.model,
      latencyMs: Date.now() - start,
    }
  }

  async embed(_texts: string[]): Promise<EmbedResult> {
    throw new Error('Anthropic does not support embeddings — use a different provider for embed')
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }
}
