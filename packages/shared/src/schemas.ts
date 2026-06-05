// Esquemas Zod de validação de input da API Sofia

import { z } from 'zod'

// ── Documentos ───────────────────────────────────────────────────────────────

export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(500),
  source_type: z.enum(['pdf', 'docx', 'pptx', 'txt', 'url', 'csv']),
  source_uri: z.string().optional(),
  category_id: z.string().uuid().optional(),
  effective_date: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional(),
  author: z.string().max(200).optional(),
})

// ── Sugestões ─────────────────────────────────────────────────────────────────

export const CreateSuggestionSchema = z.object({
  question: z.string().min(3).max(1000),
  suggested_answer: z.string().min(3).max(5000),
  session_id: z.string().uuid().optional(),
})

// ── Q&A Manual ────────────────────────────────────────────────────────────────

export const CreateManualQASchema = z.object({
  question: z.string().min(3).max(1000),
  answer: z.string().min(3).max(5000),
  category_id: z.string().uuid().optional(),
})

// ── Feedback ──────────────────────────────────────────────────────────────────

export const FeedbackSchema = z.object({
  feedback: z.enum(['positive', 'negative']),
})

// ── Fase manual ───────────────────────────────────────────────────────────────

export const MovePhaseSchemа = z.object({
  to_slug: z.string().min(1).max(100),
})

// ── Intervenção admin ─────────────────────────────────────────────────────────

export const AdminMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  admin_id: z.string().min(1),
  bitrix_chat_id: z.string().min(1),
})

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>
export type CreateSuggestionInput = z.infer<typeof CreateSuggestionSchema>
export type CreateManualQAInput = z.infer<typeof CreateManualQASchema>
export type FeedbackInput = z.infer<typeof FeedbackSchema>
export type AdminMessageInput = z.infer<typeof AdminMessageSchema>
