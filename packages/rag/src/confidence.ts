import { db } from '@sofia/db'
import type { RetrievedChunk } from './retriever.js'

export async function getThreshold(): Promise<{ threshold: number; calibrated: boolean }> {
  const { data } = await db
    .from('confidence_calibration')
    .select('current_threshold, confidence_calibrated')
    .eq('id', 1)
    .single()

  return {
    threshold: data?.current_threshold ?? 0.5,
    calibrated: data?.confidence_calibrated ?? false,
  }
}

export function calculateConfidence(chunks: RetrievedChunk[]): number {
  if (chunks.length === 0) return 0

  const topScore = chunks[0]?.score ?? 0
  // Cobertura: 3 ou mais chunks = cobertura máxima
  const coverage = Math.min(chunks.length / 3, 1)
  // Consistência: desvio padrão dos scores (baixo desvio = mais confiante)
  const scores = chunks.map((c) => c.score)
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const stdDev = Math.sqrt(scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length)
  const consistency = Math.max(0, 1 - stdDev)

  return topScore * 0.6 + coverage * 0.25 + consistency * 0.15
}

export async function isConfident(chunks: RetrievedChunk[]): Promise<{
  confident: boolean
  confidence: number
  threshold: number
  calibrated: boolean
}> {
  const confidence = calculateConfidence(chunks)
  const { threshold, calibrated } = await getThreshold()

  return {
    confident: confidence >= threshold,
    confidence,
    threshold,
    calibrated,
  }
}

/** Recalibra o threshold com base nos feedbacks recentes */
export async function recalibrateThreshold(): Promise<number> {
  const { data } = await db
    .from('chat_messages')
    .select('confidence, feedback')
    .not('feedback', 'is', null)
    .not('confidence', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500)

  if (!data || data.length < 20) {
    console.log('Calibração: menos de 20 amostras com feedback. Mantendo threshold atual.')
    return 0.5
  }

  type Row = { confidence: number; feedback: string }
  const rows = data as Row[]

  const positives = rows.filter((m) => m.feedback === 'positive').map((m) => m.confidence)
  const negatives = rows.filter((m) => m.feedback === 'negative').map((m) => m.confidence)

  if (positives.length === 0 || negatives.length === 0) return 0.5

  // Busca threshold que maximiza F1
  const candidates = [...new Set([...positives, ...negatives])].sort()
  let bestThreshold = 0.5
  let bestF1 = 0

  for (const candidate of candidates) {
    const tp = positives.filter((c) => c >= candidate).length
    const fp = negatives.filter((c) => c >= candidate).length
    const fn = positives.filter((c) => c < candidate).length
    const precision = tp / (tp + fp || 1)
    const recall = tp / (tp + fn || 1)
    const f1 = (2 * precision * recall) / (precision + recall || 1)
    if (f1 > bestF1) {
      bestF1 = f1
      bestThreshold = candidate
    }
  }

  await db
    .from('confidence_calibration')
    .update({
      current_threshold: bestThreshold,
      confidence_calibrated: true,
      sample_count: rows.length,
      last_updated: new Date().toISOString(),
    })
    .eq('id', 1)

  console.log(
    `✅ Threshold recalibrado: ${bestThreshold.toFixed(4)} (F1=${bestF1.toFixed(3)}, n=${rows.length})`
  )
  return bestThreshold
}
