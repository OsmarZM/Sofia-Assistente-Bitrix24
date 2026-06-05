import OpenAI from 'openai'
import type {
  LLMProvider,
  ChatMessage,
  ChatOptions,
  ChatResult,
  EmbedResult,
} from '../types.js'

export class OpenAIProvider implements LLMProvider {
  readonly type = 'openai' as const
  private client: OpenAI

  constructor(
    readonly id: string,
    readonly name: string,
    private readonly modelChat: string,
    private readonly modelEmbed: string,
    apiKey: string,
    baseURL?: string
  ) {
    this.client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
    const start = Date.now()

    const response = await this.client.chat.completions.create({
      model: this.modelChat,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2048,
      ...(options.functions && {
        functions: options.functions,
        function_call: 'auto',
      }),
    })

    const choice = response.choices[0]
    if (!choice) throw new Error('No completion choice returned')

    return {
      content: choice.message.content ?? '',
      tokensIn: response.usage?.prompt_tokens ?? 0,
      tokensOut: response.usage?.completion_tokens ?? 0,
      model: response.model,
      latencyMs: Date.now() - start,
      functionCall: choice.message.function_call
        ? {
            name: choice.message.function_call.name,
            arguments: JSON.parse(choice.message.function_call.arguments) as Record<string, unknown>,
          }
        : undefined,
    }
  }

  async embed(texts: string[]): Promise<EmbedResult> {
    const response = await this.client.embeddings.create({
      model: this.modelEmbed,
      input: texts,
    })

    return {
      embeddings: response.data.map((d) => d.embedding),
      tokensIn: response.usage.prompt_tokens,
      model: response.model,
    }
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }
}

/** Factory para Azure OpenAI (mesma API, endpoint diferente) */
export class AzureOpenAIProvider extends OpenAIProvider {
  override readonly type = 'azure_openai' as const

  constructor(
    id: string,
    name: string,
    modelChat: string,
    modelEmbed: string,
    apiKey: string,
    endpoint: string,
    deployment: string
  ) {
    super(id, name, deployment, deployment, apiKey, `${endpoint}/openai/deployments/${deployment}`)
    void modelChat
    void modelEmbed
  }
}
