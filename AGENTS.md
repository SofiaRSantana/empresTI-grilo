# AGENTS.md

## Visão geral
Este repositório é um monólito em Next.js com App Router, em um único projeto e um único deploy na Vercel.
A aplicação usa TypeScript em modo strict, tRPC para API, Prisma + PostgreSQL no Supabase, autenticação via Supabase Auth e multi-tenancy por `tenant_id`.

## Arquitetura
- manter front e servidor no mesmo projeto;
- não criar API separada em outro repositório ou serviço;
- usar Route Handlers do Next para tRPC;
- manter a regra de negócio em services e a entrada/autorização em procedures;
- evitar caminhos paralelos de acesso a dados;
- manter um único códigobase e um único deploy.

## Regras de implementação
- usar TypeScript em modo `strict`;
- preferir Client Components para telas com dados;
- usar tRPC como único caminho de API para a aplicação;
- validar entrada com Zod em todo procedimento;
- não usar Server Actions para mutações;
- não criar acesso a banco direto no cliente;
- manter `tenant_id` e `role` no contexto do request;
- toda autorização deve acontecer no servidor via middlewares de tRPC;
- não confiar em rota, input ou cliente para definir tenant.

## Regras de multi-tenancy
- todo dado de domínio deve ter `tenant_id`;
- o tenant deve vir da sessão/contexto, nunca do input do cliente;
- todas as operações devem respeitar `tenantProcedure` e o filtro de tenant;
- o teste obrigatório para qualquer procedimento é: tenant A não deve ver dados de tenant B.

## Segurança
- nunca expor segredos em `NEXT_PUBLIC_`;
- a chave `service_role` do Supabase deve ficar somente em código de servidor;
- usar cookie `httpOnly` para sessão;
- respeitar `protectedProcedure`, `tenantProcedure` e `adminProcedure`;
- manter RLS habilitado em todas as tabelas como defesa em profundidade;
- não usar dados de sessão do cliente para autorizar operações sensíveis;
- tratar erros com `TRPCError` e formatador centralizado.

## Banco e Prisma
- usar PostgreSQL no Supabase;
- usar Prisma como único ORM;
- manter Prisma Migrate como dono do schema;
- colocar RLS, policies e triggers dentro das migrations;
- usar singleton do Prisma para sobreviver ao hot reload;
- usar a conexão de runtime via Supavisor e a conexão de migration via `directUrl`;
- manter seed idempotente.

## Frontend
- usar Tailwind para estilos;
- usar shadcn/ui como base de componentes;
- usar TanStack Query via tRPC para estado de servidor;
- usar `useState` e `Context` para estado de cliente simples;
- usar React Hook Form + `zodResolver` para formulários.

## Testes
- usar Vitest como runner único;
- usar Testing Library para componentes;
- usar Testcontainers com Postgres real para integração;
- testar procedimentos com `createCaller` do tRPC;
- usar Playwright para fluxos chave de interface;
- não aceitar teste sem isolamento de tenant;
- priorizar caminhos críticos em vez de meta percentual de cobertura.

## Operação e deploy
- manter um único projeto na Vercel;
- usar GitHub Actions para CI;
- executar `prisma migrate deploy` antes do deploy;
- validar variáveis de ambiente no boot com Zod;
- manter log estruturado em JSON com `request_id` e `tenant_id`;
- usar Sentry para rastreamento de erro.

## Restrições de Git
- o repositório pode estar integrado ao GitHub, mas esta sessão não deve usar comandos de Git para alterar o histórico ou o remoto;
- não executar `git add`, `git commit`, `git push`, `git pull`, `git fetch`, `git merge`, `git rebase`, `git checkout`, `git switch`, `git reset` ou qualquer outro comando Git de manipulação de branch/estado;
- não criar branch, não subir mudanças e não sincronizar com o GitHub por CLI;
- qualquer operação de versionamento deve ser tratada como fora do escopo desta sessão.

## Regra para agentes IA
- não inventar arquitetura diferente da definida;
- não criar repositórios, serviços ou APIs paralelas sem pedido explícito;
- não assumir que o banco pode ser acessado do cliente;
- não propor REST/GraphQL como padrão neste projeto;
- não usar decisões fora do escopo da ADR;
- antes de editar, respeitar o padrão já existente do projeto;
- validar o menor conjunto de testes e checagens necessários.

## O que não é permitido
- usar `NEXT_PUBLIC_` para segredos;
- mover lógica para outro projeto só por conveniência;
- criar fluxo de acesso a dado duplicado;
- ignorar tenant/permissão;
- abrir cadastro público sem convite;
- deixar migrations e schema em dois donos diferentes;
- criar solução que dependa de fila/agenda sem justificativa do problema.

## Resumo da decisão
O projeto assume um modelo simples e consistente:
- um app único;
- um banco único;
- um deploy único;
- um path de dados;
- um conjunto de regras de tenant e autorização;
- uma validação centralizada.

Esse é o padrão que agentes devem seguir.
