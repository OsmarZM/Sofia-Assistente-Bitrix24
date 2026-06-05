import { db } from '@sofia/db'

/** Calcula custo em USD para uma chamada de IA */
export async function calculateCost(
  providerId: string,
  model: string,
  tokensIn: number,
  tokensOut: number
): Promise<number> {
  const { data } = await db
    .from('ai_pricing')
    .select('price_per_1k_input_tokens, price_per_1k_output_tokens')
    .eq('provider_id', providerId)
    .eq('model', model)
    .order('valid_from', { ascending: false })
    .limit(1)
    .single()

  if (!data) return 0

  const cost =
    (tokensIn / 1000) * data.price_per_1k_input_tokens +
    (tokensOut / 1000) * data.price_per_1k_output_tokens

  return Number(cost.toFixed(6))
}

/** Acumula custo no budget do período atual */
export async function accumulateCost(costUsd: number): Promise<void> {
  if (costUsd <= 0) return

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const monthStart = today.slice(0, 7) + '-01'

  await Promise.all([
    db.rpc('increment_budget_cost', { p_period: 'daily', p_period_start: today, p_amount: costUsd }),
    db.rpc('increment_budget_cost', { p_period: 'monthly', p_period_start: monthStart, p_amount: costUsd }),
  ]).catch(() => {
    // Silent — não quebrar o fluxo principal
  })
}
