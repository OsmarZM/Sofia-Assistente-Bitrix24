# Glossário

## Termos do projeto

| Termo | Definição |
|---|---|
| **RAG** | Retrieval-Augmented Generation — técnica que combina busca semântica em documentos com geração de texto por LLM |
| **Chunk** | Pedaço de texto extraído de um documento, vetorizado e armazenado em `knowledge_chunks` |
| **Embedding** | Vetor numérico de 1536 dimensões que representa o significado semântico de um texto |
| **pgvector** | Extensão do PostgreSQL que permite armazenar e buscar vetores (cosine similarity, L2, inner product) |
| **Confidence** | Score de 0.0 a 1.0 que mede o quão relevante é o contexto recuperado para a pergunta |
| **Threshold** | Valor mínimo de confidence para a Sofia responder. Abaixo disso, diz "não sei" |
| **Threshold adaptativo** | Threshold calibrado automaticamente com base no feedback 👍/👎 dos usuários |
| **Golden set** | Conjunto de perguntas com respostas esperadas, usado para avaliar a qualidade do RAG |
| **Circuit breaker** | Mecanismo que para de chamar um provider de IA após N falhas consecutivas, evitando cascata de erros |
| **Kanban** | Painel de conversas organizado em colunas (fases): Nova, Em andamento, Aguardando humano, Resolvida, Arquivada |
| **RLS** | Row Level Security — mecanismo do PostgreSQL que controla quais linhas cada role pode ver/alterar |
| **service_role** | Role do Supabase com permissão total (bypassa RLS). Usado somente na API e no Worker |
| **anon** | Role pública do Supabase. Com RLS habilitada e sem policies, não acessa nenhuma tabela |
| **BullMQ** | Biblioteca de filas de jobs baseada em Redis. Usada para processar mensagens do Bitrix e ingerir documentos |
| **IVFFlat** | Índice vetorial aproximado (Inverted File Flat) do pgvector, usado para buscas rápidas em grandes datasets |
| **MMR** | Maximal Marginal Relevance — algoritmo de reranking que balanceia relevância e diversidade nos chunks retornados |

## Siglas e abreviações

| Sigla | Significado |
|---|---|
| API | Application Programming Interface |
| LLM | Large Language Model |
| TTL | Time To Live (tempo de expiração de cache) |
| HMAC | Hash-based Message Authentication Code |
| AES-GCM | Advanced Encryption Standard - Galois/Counter Mode |
| CRUD | Create, Read, Update, Delete |
| MVP | Minimum Viable Product |
| ADR | Architecture Decision Record |
| ESM | ECMAScript Modules |
| SPA | Single Page Application |
