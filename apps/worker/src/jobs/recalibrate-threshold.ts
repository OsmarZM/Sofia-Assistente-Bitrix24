import { createWorker } from '../queues.js'
import { db } from '@sofia/db'
import { recalibrateThreshold } from '@sofia/rag'

type RecalibratePayload = { sessionId?: string }

export function createRecalibrateWorker() {
  return createWorker<RecalibratePayload>('recalibrate', async (job) => {
    const { sessionId } = job.data

    // Coleta dados de feedback de todas as mensagens com feedback
    const query = db
      .from('chat_messages')
      .select('confidence, feedback')
      .not('feedback', 'is', null)
      .not('confidence', 'is', null)

    const { data: feedbackData } = sessionId
      ? await query.eq('session_id', sessionId)
      : await query

    if (!feedbackData || feedbackData.length < 20) {
      console.log(`⚠️ Recalibrate skipped — only ${feedbackData?.length ?? 0} feedback samples`)
      return
    }

    const samples = feedbackData.map((m) => ({
      confidence: m.confidence as number,
      positive: m.feedback === 'positive',
    }))

    const newThreshold = recalibrateThreshold(samples)
    console.log(`✅ Threshold recalibrated: ${newThreshold.toFixed(3)}`)

    // Persiste na tabela de calibração
    await db.from('confidence_calibration').upsert({
      id: 1, // singleton
      threshold: newThreshold,
      calibrated: true,
      sample_count: samples.length,
      updated_at: new Date().toISOString(),
    })
  })
}
