import { createWorker } from '../queues.js'
import { db } from '@sofia/db'
import { buildProviderRouterFromEnv } from '@sofia/ai-providers'

type ProfilePayload = { bitrixUserId: string; sessionId: string }

// λ = 0.05 → meia-vida ~14 dias (0.05 * ln(2) ≈ 14 days)
const LAMBDA = 0.05

export function createProfileWorker() {
  const router = buildProviderRouterFromEnv()

  return createWorker<ProfilePayload>('profile', async (job) => {
    const { bitrixUserId, sessionId } = job.data

    // 1. Últimas N mensagens do usuário nesta sessão
    const { data: messages } = await db
      .from('chat_messages')
      .select('content, created_at, role')
      .eq('session_id', sessionId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!messages || messages.length === 0) return

    // 2. Perfil atual
    const { data: currentProfile } = await db
      .from('user_profiles')
      .select('*')
      .eq('bitrix_user_id', bitrixUserId)
      .single()

    // 3. Usa LLM para extrair tópicos e sentimento das mensagens recentes
    const now = Date.now()
    const combinedText = messages
      .map((m) => m.content)
      .slice(0, 10)
      .join('\n')

    const extractPrompt = [
      {
        role: 'system' as const,
        content:
          'Você é um analisador de perfil de usuário. Analise as mensagens e retorne JSON com: {topics: string[], sentiment: number (-1 a 1), summary: string}. Seja conciso.',
      },
      {
        role: 'user' as const,
        content: `Mensagens recentes do usuário:\n${combinedText}\n\nRetorne apenas JSON válido.`,
      },
    ]

    let extracted: { topics: string[]; sentiment: number; summary: string } | null = null
    try {
      const result = await router.chat(extractPrompt, { temperature: 0.1, maxTokens: 300 })
      extracted = JSON.parse(result.text) as typeof extracted
    } catch {
      // Falha silenciosa no profile update não deve derrubar o job
      return
    }

    if (!extracted) return

    // 4. Decaimento exponencial para pesos temporais
    // w_i = exp(-λ * age_days)
    const ageDays = (now - new Date(messages[0]!.created_at).getTime()) / (1000 * 60 * 60 * 24)
    const weight = Math.exp(-LAMBDA * Math.max(0, ageDays))

    // 5. Atualiza perfil com decaimento
    const existingTopics: Record<string, number> = currentProfile?.topics_json
      ? (currentProfile.topics_json as Record<string, number>)
      : {}

    // Aplica decaimento em tópicos existentes
    for (const key of Object.keys(existingTopics)) {
      existingTopics[key] = (existingTopics[key] ?? 0) * Math.exp(-LAMBDA)
    }
    // Adiciona novos tópicos com peso atual
    for (const topic of extracted.topics ?? []) {
      existingTopics[topic] = ((existingTopics[topic] ?? 0) + weight)
    }

    // Remove tópicos com peso muito baixo (<0.01)
    for (const key of Object.keys(existingTopics)) {
      if ((existingTopics[key] ?? 0) < 0.01) delete existingTopics[key]
    }

    const newSentiment = currentProfile?.sentiment_avg != null
      ? 0.7 * (currentProfile.sentiment_avg as number) + 0.3 * extracted.sentiment
      : extracted.sentiment

    await db.from('user_profiles').upsert({
      bitrix_user_id: bitrixUserId,
      topics_json: existingTopics as never,
      sentiment_avg: newSentiment,
      summary: extracted.summary,
      updated_at: new Date().toISOString(),
    })
  })
}
