-- Migration: Search RPC para pgvector
-- Função usada por packages/rag/src/retriever.ts

CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  query_embedding  vector(1536),
  match_threshold  float4 DEFAULT 0.35,
  match_count      int     DEFAULT 8,
  p_category_id    uuid    DEFAULT NULL
)
RETURNS TABLE (
  id            uuid,
  document_id   uuid,
  content       text,
  metadata      jsonb,
  similarity    float4,
  expires_at    timestamptz,
  effective_date timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kc.content,
    kc.metadata,
    (1 - (kc.embedding <=> query_embedding))::float4 AS similarity,
    kc.expires_at,
    kc.effective_date
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kd.id = kc.document_id
  WHERE
    kd.status = 'processed'
    AND (p_category_id IS NULL OR kd.category_id = p_category_id)
    AND (1 - (kc.embedding <=> query_embedding)) >= match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Garante que o índice IVFFlat existe (pode já ter sido criado no 0001)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_chunks_embedding'
  ) THEN
    CREATE INDEX idx_knowledge_chunks_embedding
      ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
  END IF;
END;
$$;
