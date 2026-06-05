# Objetivos — Sofia Assistente Virtual

## Objetivo principal

Reduzir o tempo gasto pelos colaboradores da Fortatech buscando informações internas, substituindo pesquisas em pastas, e-mails e perguntas repetitivas por uma assistente que **responde em segundos com fontes citadas**.

---

## Objetivos específicos (MVP)

1. **Responder perguntas** sobre processos, políticas, produtos e procedimentos internos via chat Bitrix24
2. **Aprender com documentos** — ingerir PDF, DOCX, PPTX, URLs e Q&A manual
3. **Melhorar continuamente** — feedback 👍/👎 calibra o threshold de confiança automaticamente
4. **Saber quando não sabe** — quando confidence < threshold, admite e cria sugestão de conhecimento
5. **Nunca inventar** — toda resposta cita a fonte, com data de validade quando relevante
6. **Custar pouco** — rastrear custo por mensagem, alertar quando orçamento diário/mensal for atingido
7. **Ser monitorada** — painel admin com kanban de conversas, dashboard de métricas, live monitor

---

## O que a Sofia não faz (MVP)

- Não executa ações no Bitrix24 (criar tarefas, marcar reuniões)
- Não integra WhatsApp, e-mail ou outros canais
- Não transcreve vídeos ou lê imagens
- Não serve múltiplas empresas (single-tenant)
- Não tem fine-tuning de modelo

---

## Critérios de sucesso

| Métrica | Meta |
|---|---|
| Precision no golden set | ≥ 85% |
| Recall no golden set | ≥ 75% |
| Latência de resposta p95 | < 5 segundos |
| Taxa de "não sei" | < 20% das perguntas com resposta na base |
| Custo médio por mensagem | < R$ 0,05 |
