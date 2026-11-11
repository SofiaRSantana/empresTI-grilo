# Plano proposto — 002 Catálogo de leitura

Status: rascunho condicionado à revisão de `002-catalogo-leitura.spec.md`; não autoriza implementação.

## Abordagem

Reutilizar a sessão e o contexto da spec 001. Expor `equipment.list` por tRPC, com entrada Zod, `tenantProcedure` e service que acessa Prisma com tenant do contexto. Consumir por TanStack Query via tRPC em Client Component. Não criar API ou store de servidor paralelos.

Definir antes os campos públicos, a visibilidade de manutenção, ordenação e filtros. Se houver paginação, usar cursor conforme ADR-001. Não implementar detalhes pendentes como decisões técnicas silenciosas.

## Arquivos previstos e contratos

- Existente: `frontend/app/catalogo/page.tsx`; consultar dependências de `frontend/lib/empres-ti-store.ts` antes de qualquer remoção.
- Novos: `frontend/src/server/api/routers/equipment.ts`, `frontend/src/server/services/equipment.ts`, testes de procedimento/service e componentes.
- Reutilizados após infraestrutura: contexto, Prisma singleton, router raiz e provider tRPC. Caminhos finais serão confirmados no plano de infraestrutura da spec 001.
- Entrada proposta: sem tenant; filtros e cursor dependem de D-03. Saída inferida do AppRouter com os campos aprovados em D-02. Falta de sessão retorna UNAUTHORIZED; demais erros devem preservar o formato TRPCError definido no ADR.

## Sequência e dependências

1. Resolver D-01 a D-04, revisar spec e aprovar plano/tarefas.
2. Confirmar a infraestrutura compartilhada e sessão da spec 001; preparar fixtures sintéticas locais em dois tenants.
3. Implementar consulta no servidor, sem mutação; testar isolamento e ausência de sessão.
4. Integrar cards e estados de carregamento, vazio e erro com dados do servidor, preservando o Nocturne.
5. Conferir o impacto na ação demonstrativa de empréstimo. Se a integração de leitura tornar essa ação incompatível, apresentar a dependência ao time e bloquear a etapa afetada até tarefa específica aprovada.
6. Executar checks e verificação independente.

## Testes e riscos

Vitest com `createCaller` e PostgreSQL real local: CA-01/CA-02 e parte servidora de CA-04. Testing Library: CA-03 a CA-06, incluindo ausência de fallback demonstrativo e ação indisponível para manutenção. Playwright: fluxo autenticado de leitura e apresentação de estados em ambiente local preparado. Cada teste cita spec e CA, conforme `rules/tests.md`.

Usar os comandos de `rules/checks.md` em `frontend/`; scripts de testes ainda dependem da infraestrutura. Riscos: vazamento entre tenants, exposição de dados do tomador sem decisão, conflito visual sobre manutenção e acoplamento da leitura com o empréstimo demonstrativo. Não executar migrations, acessar Supabase remoto ou publicar para provar esta spec.
