# Visão Geral — Sofia Assistente Virtual

## O que é a Sofia?

A Sofia é uma **funcionária digital da Fortatech** que vive dentro do Bitrix24. Diferente de um bot tradicional, ela existe como um **usuário real** no portal (com perfil, foto e nome), o que torna as conversas mais naturais para os colaboradores.

Ela responde perguntas usando uma **base de conhecimento vetorial** (RAG — Retrieval-Augmented Generation) alimentada por documentos internos da empresa.

---

## Por que não é um bot?

- Bots do Bitrix24 têm limitações de interface (não aparecem em chats de grupo normalmente)
- Usuário real permite histórico completo, menções (`@Sofia`) e integração com todos os tipos de chat
- Mais natural para os colaboradores — parece uma colega respondendo

---

## Componentes principais

| Componente | Papel |
|---|---|
| **API Fastify** | Recebe eventos do Bitrix24, expõe rotas do painel admin |
| **Worker BullMQ** | Processa mensagens, ingere documentos, atualiza perfis |
| **Painel Admin** | Gerencia conhecimento, monitora conversas (kanban), visualiza custos |
| **Supabase + pgvector** | Armazena documentos, chunks vetorizados, histórico de conversas |
| **OpenAI** | Gera embeddings e respostas (com fallback para outros providers) |

---

## Navegação

- [Objetivos](objetivos.md)
- [Escopo do MVP](escopo-mvp.md)
- [Glossário](glossario.md)
