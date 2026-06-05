// GERADO AUTOMATICAMENTE por scripts/regen-docs.ts
// Para tipos completos use: npx supabase gen types typescript --project-id eeswigmlasmblrrvemzw

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          bitrix_user_id: string
          name: string
          position: string | null
          department: string | null
          email: string | null
          photo_url: string | null
          last_seen: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      knowledge_categories: {
        Row: { id: string; name: string; slug: string; parent_id: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['knowledge_categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['knowledge_categories']['Insert']>
      }
      knowledge_documents: {
        Row: {
          id: string
          source_type: 'pdf' | 'docx' | 'pptx' | 'txt' | 'url' | 'manual_qa' | 'csv'
          source_uri: string | null
          title: string
          status: 'uploaded' | 'processing' | 'processed' | 'failed' | 'archived'
          error_msg: string | null
          uploaded_by: string | null
          author: string | null
          version: number
          effective_date: string | null
          expires_at: string | null
          review_cycle_days: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['knowledge_documents']['Row'], 'id' | 'created_at' | 'updated_at' | 'version'>
        Update: Partial<Database['public']['Tables']['knowledge_documents']['Insert']>
      }
      knowledge_chunks: {
        Row: {
          id: string
          document_id: string
          category_id: string | null
          content: string
          embedding: number[] | null
          metadata: Json
          version: number
          effective_date: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['knowledge_chunks']['Row'], 'id' | 'created_at' | 'version'>
        Update: Partial<Database['public']['Tables']['knowledge_chunks']['Insert']>
      }
      knowledge_manual_qa: {
        Row: {
          id: string
          question: string
          answer: string
          category_id: string | null
          status: 'active' | 'archived'
          effective_date: string | null
          expires_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['knowledge_manual_qa']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['knowledge_manual_qa']['Insert']>
      }
      knowledge_suggestions: {
        Row: {
          id: string
          original_question: string
          sofia_answer: string | null
          human_correction: string | null
          suggested_by: string
          session_id: string | null
          message_id: string | null
          status: 'pending' | 'approved' | 'rejected' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['knowledge_suggestions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['knowledge_suggestions']['Insert']>
      }
      chat_sessions: {
        Row: {
          id: string
          bitrix_chat_id: string
          bitrix_user_id: string
          started_at: string
          last_msg_at: string
          summary: string | null
          sentiment: 'positive' | 'neutral' | 'frustrated' | 'unknown' | null
          current_phase_id: string | null
          closed_at: string | null
          closed_reason: 'auto_inactivity' | 'manual' | 'escalated' | null
          sofia_paused: boolean
        }
        Insert: Omit<Database['public']['Tables']['chat_sessions']['Row'], 'id' | 'started_at' | 'last_msg_at'>
        Update: Partial<Database['public']['Tables']['chat_sessions']['Insert']>
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'sofia' | 'admin_as_sofia' | 'system'
          content: string
          sources: Json | null
          provider_id: string | null
          model: string | null
          tokens_in: number | null
          tokens_out: number | null
          cost_usd: number | null
          latency_ms: number | null
          cache_hit: boolean
          confidence: number | null
          feedback: 'positive' | 'negative' | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at' | 'cache_hit'>
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
      }
      ai_providers: {
        Row: {
          id: string
          name: string
          type: 'openai' | 'azure_openai' | 'anthropic' | 'grok' | 'gemini'
          config: Json
          priority: number
          enabled: boolean
          model_chat: string
          model_embed: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_providers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['ai_providers']['Insert']>
      }
      ai_provider_health: {
        Row: {
          provider_id: string
          last_success: string | null
          last_failure: string | null
          consecutive_failures: number
          circuit_open_until: string | null
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['ai_provider_health']['Row']> & { provider_id: string }
        Update: Partial<Database['public']['Tables']['ai_provider_health']['Row']>
      }
      ai_pricing: {
        Row: {
          id: string
          provider_id: string
          model: string
          price_per_1k_input_tokens: number
          price_per_1k_output_tokens: number
          valid_from: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_pricing']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['ai_pricing']['Insert']>
      }
      conversation_phases: {
        Row: {
          id: string
          name: string
          slug: string
          order: number
          color: string
          is_terminal: boolean
          auto_transition_rules: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['conversation_phases']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['conversation_phases']['Insert']>
      }
      conversation_phase_transitions: {
        Row: {
          id: string
          session_id: string
          from_phase_id: string | null
          to_phase_id: string | null
          reason: string | null
          actor: 'auto' | 'admin' | 'sofia'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['conversation_phase_transitions']['Row'], 'id' | 'created_at'>
        Update: never
      }
      user_profiles: {
        Row: {
          bitrix_user_id: string
          top_topics: Json
          knowledge_gaps: Json
          summary_text: string | null
          profile_version: number
          weekly_digest_at: string | null
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['user_profiles']['Row']> & { bitrix_user_id: string }
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
      response_cache: {
        Row: {
          id: string
          query_hash: string
          chunk_ids_hash: string
          response: string
          sources: Json | null
          provider_used: string | null
          tokens_in: number | null
          tokens_out: number | null
          cost_usd: number | null
          expires_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['response_cache']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['response_cache']['Insert']>
      }
      confidence_calibration: {
        Row: {
          id: number
          window_size: number
          current_threshold: number
          confidence_calibrated: boolean
          sample_count: number
          last_updated: string
        }
        Insert: Partial<Database['public']['Tables']['confidence_calibration']['Row']>
        Update: Partial<Database['public']['Tables']['confidence_calibration']['Row']>
      }
      cost_budgets: {
        Row: {
          id: string
          period: 'daily' | 'monthly'
          limit_usd: number
          current_usd: number
          alert_threshold_pct: number
          period_start: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['cost_budgets']['Row'], 'id' | 'updated_at' | 'current_usd'>
        Update: Partial<Database['public']['Tables']['cost_budgets']['Insert']>
      }
      admin_alerts: {
        Row: {
          id: string
          type: string
          severity: 'info' | 'warning' | 'error' | 'critical'
          message: string
          payload: Json | null
          acknowledged_by: string | null
          acknowledged_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_alerts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['admin_alerts']['Insert']>
      }
      admin_interventions: {
        Row: {
          id: string
          session_id: string
          admin_id: string
          action: 'pause_sofia' | 'resume_sofia' | 'manual_message'
          content: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_interventions']['Row'], 'id' | 'created_at'>
        Update: never
      }
      bitrix_events: {
        Row: {
          id: string
          event_type: string
          payload: Json
          processed: boolean
          error: string | null
          attempts: number
          created_at: string
          processed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['bitrix_events']['Row'], 'id' | 'created_at' | 'processed' | 'attempts'>
        Update: Partial<Database['public']['Tables']['bitrix_events']['Row']>
      }
      audit_logs: {
        Row: {
          id: string
          actor: string
          action: string
          entity: string
          entity_id: string | null
          before: Json | null
          after: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
    Functions: {
      advance_session_phase: {
        Args: {
          p_session_id: string
          p_from_slug: string
          p_to_slug: string
          p_actor?: string
          p_reason?: string
        }
        Returns: void
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
