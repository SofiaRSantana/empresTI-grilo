# AGENTS.md

## Visão geral
Este repositório segue um monólito em Next.js App Router, com um único app, um único banco e um único deploy na Vercel. O padrão formal da arquitetura está em `docs/adr/001-stack.md`; este arquivo é o guia operacional curto para agentes.

## Regras operacionais
- manter front e servidor no mesmo projeto;
- não criar API separada, serviço paralelo ou repositório extra;
- usar App Router do Next e tRPC como único caminho de API;
- usar TypeScript em modo `strict` e Zod em entradas de procedimentos;
- manter regra de negócio em services e autorização/validação em procedures;
- não acessar banco do cliente e não usar Server Actions para mutações;
- manter `tenant_id`, `role` e sessão no contexto do request;
- autorizar no servidor via middlewares de tRPC (`protectedProcedure`, `tenantProcedure`, `adminProcedure`);
- nunca confiar em rota, input ou cliente para definir tenant.

## Segurança e multi-tenancy
- todo dado de domínio precisa de `tenant_id`;
- o tenant vem da sessão/contexto, nunca do input;
- todas as operações devem respeitar isolamento por tenant;
- nunca expor segredos em `NEXT_PUBLIC_`; a `service_role` fica só em código de servidor;
- usar cookie `httpOnly` para sessão;
- manter RLS habilitado como defesa em profundidade.

## Frontend e dados
- usar Tailwind para estilos e Client Components para telas com dados;
- usar React Hook Form + `zodResolver` quando houver formulário;
- usar TanStack Query via tRPC para dados do servidor;
- usar `useState`/Context apenas para estado local simples.

## Banco e testes
- usar PostgreSQL + Prisma como stack de dados;
- manter Prisma Migrate como dono do schema;
- testar procedimentos com `createCaller` e validar isolamento entre tenants;
- usar Vitest e Testing Library; e Playwright para fluxos-chave.

## Operação e deploy
- manter um único projeto na Vercel;
- rodar CI e validar variáveis de ambiente com Zod;
- executar `prisma migrate deploy` antes do deploy;
- manter logs estruturados com `request_id` e `tenant_id` e usar Sentry para rastreamento.

## Precedência
- o ADR-001 é a decisão formal do projeto;
- este AGENTS é a regra operacional curta para a execução do trabalho;
- se houver conflito entre os dois, o ADR-001 vence;
- agentes devem seguir o padrão já existente e não inventar arquitetura paralela.

## Restrições de execução
- não criar branch, push, merge, fetch ou manipular git remoto nesta sessão;
- não alterar o histórico do repositório nem sincronizar branches por CLI;
- não abrir caixa de dados duplicada nem usar arquitetura paralela sem pedido explícito.

## Subagentes
- Ficam em agents/<nome>.md. O frontmatter diz quando delegar; o
  corpo é a instrução completa do subagente.
- Subagente não herda esta conversa: ao delegar, passe tudo que o
  arquivo dele pede como entrada.
- Se o harness não tiver subagentes, abra uma sessão nova e comece
  com: "Aja conforme agents/<nome>.md." e as entradas pedidas.

## Skills do projeto

- `skills/empresti-revisar-codigo/SKILL.md`: revisão de código ou plano técnico com SOLID aplicado às camadas Next.js, tRPC e Prisma; não substitui o verificador de CAs.
- `skills/empresti-nocturne/SKILL.md`: aplicação e revisão visual do Nocturne conforme ADR-002 e layout, nas telas e componentes abrangidos pela tarefa.
- Ao receber tarefa compatível, leia somente a skill relevante antes de executar. Os caminhos acima são relativos à raiz; se estiver em `frontend/`, resolva a raiz primeiro. Pedido explícito pelo nome também seleciona a skill.
- As skills orientam o trabalho do agente atual. Não são subagentes, não aprovam decisões e não ampliam o escopo autorizado. Regras e decisões continuam nas fontes referenciadas por elas.
