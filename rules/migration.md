---
description: Procedimento para qualquer mudança de schema
globs: ["frontend/prisma/**", "supabase/migrations/**"]
alwaysApply: false
---

# Mudança de schema

## Quando

Qualquer tarefa que precise criar, alterar ou remover tabela, coluna, índice, restrição ou política de acesso.

## Procedimento

1. Apresente o DDL pretendido e espere a aprovação da responsável pelo projeto antes de gerar a migration.
2. Use o Prisma Migrate como único dono do schema da aplicação, conforme o ADR-001. Versione o schema e o SQL em `frontend/prisma/`. Inclua no SQL das migrations os objetos que o Prisma não representa, como políticas, funções e triggers.
3. Para toda tabela de domínio nova, habilite RLS com política explícita na mesma migration.
4. Para tabelas com dados, descreva o efeito sobre as linhas existentes. Coluna obrigatória nova precisa de valor padrão ou de uma etapa de preenchimento.
5. Ao adotar o Prisma em um banco existente, compare o schema efetivo com a migration inicial antes de registrá-la como aplicada.
6. Aplique as migrations em ambiente Supabase local descartável e execute os [checks do projeto](checks.md).

## Verificação

Em ambiente local novo, a sequência do Prisma Migrate deve recriar o schema da aplicação, incluindo RLS, políticas e triggers. Em um ambiente com dados anteriores, verifique também a preservação das linhas e das restrições existentes.

## Limites

- Versione as mudanças de schema em migrations.
- Preserve migrations já publicadas. Mantenha o SQL inicial do Supabase como histórico e uma única sequência ativa de migrations.
- A validação padrão usa banco local. Consultas ao Supabase publicado exigem autorização específica. A aplicação em produção cabe à responsável pelo projeto, na etapa de publicação aprovada.
