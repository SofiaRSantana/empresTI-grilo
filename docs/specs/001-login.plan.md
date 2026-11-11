# Plano proposto — 001 Login

Status: rascunho condicionado à revisão de `001-login.spec.md`; não autoriza implementação.

## Abordagem e contratos

Manter o aplicativo em `frontend/`. Usar React Hook Form com zodResolver na tela, tRPC com Zod na entrada, Supabase Auth/SSR no servidor e contexto de request conforme o ADR-001. Separar validação/autorização do procedimento e coordenação de autenticação em service. Prisma acessa memberships; nunca uma tabela de senhas própria. Definir renovação de sessão segundo a documentação local da versão instalada do Next antes de escrever código.

O nome proposto `auth.login` não constitui API aprovada. Definir retorno, erros e redirecionamento após D-01 a D-04. O cookie deve satisfazer CA-05; não presumir que usar `@supabase/ssr` garante isso sem configurar e testar os atributos.

## Arquivos previstos

- Existentes: `frontend/app/login/page.tsx`, `frontend/lib/empres-ti-store.ts`, `frontend/package.json` e lockfile existente, quando houver.
- Novos, após aprovação: `frontend/src/server/api/routers/auth.ts`, contexto e middlewares tRPC em `frontend/src/server/api/`, service de autenticação em `frontend/src/server/services/`, cliente SSR e Prisma singleton em módulos de servidor.
- Endpoint previsto pelo ADR: `frontend/app/api/trpc/[trpc]/route.ts`.
- Arquivos de integração Next, providers e testes: definir os caminhos finais após consultar os guias locais e aprovar a tarefa de infraestrutura; não gerar scaffold automático.

## Dependências e sequência

1. Revisar spec e fechar D-01 a D-04.
2. Aprovar infraestrutura compartilhada: tRPC, contexto, validação de ambiente e testes, sem criar segundo app ou banco paralelo.
3. Preparar fixtures locais de autenticação e memberships; schema é tarefa separada após resolução do conflito de migrations.
4. Implementar procedimento/service e provas de sessão e autorização.
5. Integrar formulário e estados aprovados, preservando tokens Nocturne.
6. Executar checks e delegar a verificação independente.

## Estratégia de testes e riscos

Vitest e `createCaller` cobrem CA-02 a CA-04 e CA-06 com contexto controlado; integração real confirma identidade e memberships. Testing Library cobre campos e mensagens. Playwright, com aplicativo e provedor local preparados, prova CA-01 e CA-05, cookie e recarga. Asserções unitárias não substituem as provas reais desses CAs.

Seguir `rules/tests.md` e `rules/checks.md`. Atualmente apenas lint/build existem; scripts de testes serão definidos pela tarefa de infraestrutura. Não executar testes contra Supabase remoto. Riscos: política de tenant indefinida, configuração de cookie, segredos no cliente e infraestrutura ainda ausente.

## Revisão e entrega

O time revisa primeiro a spec e depois este plano e `001-login.tasks.md`. Implementar uma tarefa autorizada por vez. Ao final, fornecer spec e escopo completo ao `agents/verificador-spec.md`, sem criar commits proibidos. Documento escrito não equivale a funcionalidade pronta.
