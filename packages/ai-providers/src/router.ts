import type { LLMProvider, ChatMessage, ChatOptions, RoutedChatResult, RoutedEmbedResult } from './types.js'
import { isCircuitOpen, recordSuccess, recordFailure } from './circuit-breaker.js'
import { db } from '@sofia/db'

const MAX_RETRIES = 3
const RETRY_DELAYS_MS = [500, 1000, 2000]

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function withRetry<T>(
  fn: () => Promise<T>,
  providerId: string
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (isCircuitOpen(providerId)) {
      throw new Error(`Circuit open for provider ${providerId}`)
    }

    try {
      const result = await fn()
      recordSuccess(providerId)
      await syncHealthToDb(providerId, true)
      return result
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const state = recordFailure(providerId)
      await syncHealthToDb(providerId, false, state.consecutiveFailures)

      if (state.state === 'open') break // Circuit abriu — para
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAYS_MS[attempt] ?? 2000)
      }
    }
  }

  throw lastError ?? new Error('Unknown provider error')
}

async function syncHealthToDb(
  providerId: string,
  success: boolean,
  consecutiveFailures = 0
): Promise<void> {
  try {
    await db.from('ai_provider_health').upsert(
      {
        provider_id: providerId,
        ...(success
          ? { last_success: new Date().toISOString(), consecutive_failures: 0 }
          : {
              last_failure: new Date().toISOString(),
              consecutive_failures: consecutiveFailures,
            }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'provider_id' }
    )
  } catch {
    // Health sync não deve quebrar o fluxo principal
  }
}

export class ProviderRouter {
  constructor(private readonly providers: LLMProvider[]) {}

  private available(): LLMProvider[] {
    return this.providers
      .filter((p) => !isCircuitOpen(p.id))
      .sort(() => 0) // já ordenados por priority no construtor
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<RoutedChatResult> {
    const available = this.available()
    if (available.length === 0) throw new Error('DEGRADED: All AI providers unavailable')

    let lastError: Error | null = null

    for (const provider of available) {
      try {
        const result = await withRetry(() => provider.chat(messages, options), provider.id)
        return { ...result, providerId: provider.id }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
      }
    }

    throw lastError ?? new Error('DEGRADED: All providers failed')
  }

  async embed(texts: string[]): Promise<RoutedEmbedResult> {
    const available = this.available()
    if (available.length === 0) throw new Error('DEGRADED: All AI providers unavailable')

    let lastError: Error | null = null

    for (const provider of available) {
      try {
        const result = await withRetry(() => provider.embed(texts), provider.id)
        return { ...result, providerId: provider.id }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
      }
    }

    throw lastError ?? new Error('DEGRADED: All embed providers failed')
  }
}

// Re-export state helpers para monitoring
export { getCircuitState, getAllCircuitStates } from './circuit-breaker.js'
