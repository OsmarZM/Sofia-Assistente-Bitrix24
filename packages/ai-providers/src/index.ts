export type { LLMProvider, ChatMessage, ChatOptions, ChatResult, EmbedResult, RoutedChatResult, RoutedEmbedResult, ProviderConfig } from './types.js'
export { ProviderRouter, getCircuitState, getAllCircuitStates } from './router.js'
export { OpenAIProvider, AzureOpenAIProvider } from './providers/openai.js'
export { AnthropicProvider } from './providers/anthropic.js'
export { calculateCost, accumulateCost } from './cost-meter.js'
export { isCircuitOpen, recordSuccess, recordFailure } from './circuit-breaker.js'

/**
 * Constrói um ProviderRouter a partir das variáveis de ambiente.
 * Usado por apps/api e apps/worker para instanciar o router.
 */
import { ProviderRouter } from './router.js'
import { OpenAIProvider, AzureOpenAIProvider } from './providers/openai.js'
import { AnthropicProvider } from './providers/anthropic.js'
import type { LLMProvider } from './types.js'

export function buildProviderRouterFromEnv(): ProviderRouter {
  const providers: LLMProvider[] = []

  // OpenAI primário
  const openAiKey = process.env['OPENAI_API_KEY']
  if (openAiKey) {
    providers.push(
      new OpenAIProvider(
        'openai-primary',
        'OpenAI GPT-4o-mini',
        process.env['OPENAI_MODEL_CHAT'] ?? 'gpt-4o-mini',
        process.env['OPENAI_MODEL_EMBED'] ?? 'text-embedding-3-small',
        openAiKey
      )
    )
  }

  // Azure OpenAI (fallback)
  const azureKey = process.env['AZURE_OPENAI_API_KEY']
  const azureEndpoint = process.env['AZURE_OPENAI_ENDPOINT']
  const azureDeployment = process.env['AZURE_OPENAI_DEPLOYMENT']
  if (azureKey && azureEndpoint && azureDeployment) {
    providers.push(
      new AzureOpenAIProvider(
        'azure-openai',
        'Azure OpenAI',
        azureDeployment,
        azureDeployment,
        azureKey,
        azureEndpoint,
        azureDeployment
      )
    )
  }

  // Anthropic (fallback adicional)
  const anthropicKey = process.env['ANTHROPIC_API_KEY']
  if (anthropicKey) {
    providers.push(
      new AnthropicProvider('anthropic', 'Anthropic Claude', 'claude-3-haiku-20240307', anthropicKey)
    )
  }

  if (providers.length === 0) {
    throw new Error('No AI providers configured. Set at least OPENAI_API_KEY.')
  }

  return new ProviderRouter(providers)
}
