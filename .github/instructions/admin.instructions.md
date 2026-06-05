---
applyTo: "apps/admin/**"
---

# Admin Next.js — Instruções

## Stack

- Next.js 14 App Router + TypeScript strict
- Tailwind CSS + shadcn/ui
- dnd-kit (kanban drag-and-drop)
- recharts (gráficos)
- Supabase Auth (autenticação)

## Regras obrigatórias

1. **NUNCA** importe `@sofia/db` no lado client (browser).
2. **NUNCA** use `SUPABASE_SERVICE_ROLE_KEY` no frontend — é segredo de servidor.
3. **Toda** operação de dados deve ir via API Fastify (`NEXT_PUBLIC_API_URL`).
4. **UI/mensagens**: sempre em **pt-BR**.
5. **Componentes** reutilizáveis em `components/ui/` (shadcn).

## Estrutura

```
apps/admin/src/
├── app/
│   ├── (auth)/login/        # Tela de login
│   ├── dashboard/           # Dashboard de métricas
│   ├── conversations/       # Kanban
│   ├── knowledge/
│   │   ├── documents/
│   │   ├── qa/
│   │   └── suggestions/
│   ├── users/
│   └── settings/
│       └── providers/
├── components/
│   ├── ui/                  # shadcn/ui primitivos
│   ├── kanban/              # dnd-kit board
│   └── charts/              # recharts wrappers
└── lib/
    └── api.ts               # fetch wrapper com auth header
```

## Padrão de fetch para a API

```typescript
// lib/api.ts
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}
```

## Referências

- Telas: `docs/04-frontend-admin/telas.md`
- Fluxo kanban: `docs/04-frontend-admin/fluxos.md`
- Componentes shadcn: https://ui.shadcn.com/docs/components
