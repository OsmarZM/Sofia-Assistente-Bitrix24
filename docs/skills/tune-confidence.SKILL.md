---
description: "Guia para ajustar o threshold de confidence da Sofia quando ela responde muito (respostas incorretas) ou muito pouco (muitos 'não sei'). Use quando a calibração precisar de intervenção manual."
---

# Skill: Ajustar Confidence Threshold

## Quando usar

- Sofia está respondendo perguntas com informações incorretas (threshold muito baixo)
- Sofia está dizendo "Não encontrei informações" para perguntas que deveriam ter resposta (threshold muito alto)
- Confidence calibrada automaticamente mas resultado não satisfatório
- Antes de ir para produção com golden set de Q&A

---

## Entendendo o threshold

```
Confidence score = 0..1

Se confidence >= threshold → Sofia responde
Se confidence < threshold  → "Não encontrei informações sobre isso"
```

**Threshold muito baixo** (ex: 0.2): Sofia responde com chunks pouco relevantes → respostas incorretas  
**Threshold muito alto** (ex: 0.9): Sofia não responde nem quando tem informação → muitos "não sei"

---

## Ver estado atual

```sql
SELECT current_threshold, precision_at_threshold, recall_at_threshold,
       sample_count, confidence_calibrated, last_calibrated_at
FROM confidence_calibration;
```

Ou via painel: **Settings → Threshold atual**

---

## Ajuste manual imediato

```sql
UPDATE confidence_calibration
SET current_threshold = 0.6,   -- Ajuste conforme necessidade
    last_calibrated_at = NOW()
WHERE id = (SELECT id FROM confidence_calibration LIMIT 1);
```

**Valores de referência:**

| Situação | Threshold sugerido |
|---|---|
| Base de conhecimento grande e bem estruturada | 0.55–0.65 |
| Base pequena ou com documentos heterogêneos | 0.45–0.55 |
| Antes de calibração (bootstrap) | 0.50 |
| Após calibração automática com 50+ feedbacks | Use o valor calculado |

---

## Forçar recalibração automática

```bash
# Via API
curl -X POST http://localhost:3001/admin/recalibrate

# Ou via BullMQ — enfileirar job manualmente:
# No painel admin: Settings → Recalibrar agora
```

---

## Criar golden set de Q&A

Golden set = 50-100 pares pergunta/resposta esperada usados para avaliar o RAG.

```bash
# Avaliar com golden set
pnpm eval-rag

# Saída esperada:
# precision: 0.87 (≥ 0.85 ✅)
# recall: 0.79 (≥ 0.75 ✅)
# threshold ideal: 0.62
```

---

## Monitorar via dashboard

**Settings → Histograma de confidence**:
- Barras à esquerda da linha = "não sei"
- Barras à direita = respostas enviadas
- Ajustar a linha até equilibrar precision/recall desejados

---

## Checklist antes de produção

- [ ] Golden set criado (mínimo 50 Q&A reais da Fortatech)
- [ ] `pnpm eval-rag` com precision ≥ 0.85 e recall ≥ 0.75
- [ ] `confidence_calibrated = true` (sample_count ≥ 50)
- [ ] Threshold validado por alguém que conhece o conteúdo

## Referências

- Retrieval: `docs/06-ia-rag/retrieval.md`
- Job recalibração: `apps/worker/src/jobs/recalibrate-threshold.ts`
- Tabela: `confidence_calibration` em `docs/07-banco/schema.md`
