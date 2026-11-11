---
description: Verificações e condições para encerrar uma tarefa do EmpresTI.
globs: []
alwaysApply: true
---

# Checks — EmpresTI

## Antes de executar

Leia a tarefa, a spec e `rules/restrictions.md`. Confira os scripts e configurações atuais antes de rodar comandos, incluindo hooks e destino efetivo das conexões. Não exiba segredos. Verificação não autoriza instalação, alteração de lockfile, migration, seed, reset, Git remoto ou deploy.

Se houver acesso a dados, siga `rules/tests.md`: somente banco local descartável e já preparado. Destino remoto ou desconhecido impede a execução dependente. Registre a causa e prossiga apenas com verificações independentes seguras.

## Comandos existentes

Os comandos abaixo existem em `frontend/package.json`. Execute no diretório `frontend/`, com dependências já disponíveis:

| Comando | Quando executar | Evidência |
| --- | --- | --- |
| `npm run lint` | Alteração em código ou configuração abrangida pelo ESLint | Análise estática sem `--fix` |
| `npm run build` | Alteração que afete a aplicação ou sua compilação | Compilação de produção local; não publica |
| `npm test` | Regras de negócio e procedimentos | Vitest. Informe `EMPRESTI_TEST_DATABASE_URL` para incluir a integração PostgreSQL local. |
| `npm run test:e2e` | Fluxo de tela com o ambiente local preparado | Playwright. Usa o aplicativo local em `127.0.0.1:3315`. |

Build pode gerar artefatos e executar código do aplicativo. Inspecione essa execução antes de rodar. Se exigir rede, segredo remoto ou ação fora do escopo, registre como não executado. Não copie credenciais de produção para viabilizá-lo.

Para a integração, confira o banco descartável antes de executar. Sem `EMPRESTI_TEST_DATABASE_URL`, o Vitest roda os testes unitários e pula os testes de banco. O teste de inventário também precisa das variáveis locais de Storage e do manifesto citadas abaixo. Uma rodada com testes pulados não comprova os critérios correspondentes.

Para a skill de imagens da spec 003, execute `node --test skills/imagens-equipamentos/scripts/fotos.test.mjs` na raiz do repositório.

Para Playwright, o agente principal prepara e inicia o aplicativo local com `npm run dev -- --webpack --hostname 127.0.0.1 --port 3315`. O runner usa `EMPRESTI_TEST_DATABASE_URL`, `EMPRESTI_TEST_SUPABASE_SECRET_KEY` do Supabase local e `EMPRESTI_TEST_PHOTO_MANIFEST` apontando para o manifesto revisado. Use `EMPRESTI_TEST_BROWSER_CHANNEL=msedge` se for rodar no Edge instalado. Os testes criam e removem somente as próprias fixtures.

## Mudança exclusivamente documental

Não exige build ou lint da aplicação. Confira:

1. Caminhos e referências locais; arquivos futuros devem estar identificados como previstos.
2. Consistência com PRD, ADRs, AGENTS e restrições, sem aprovar decisões pelo time.
3. IDs de critérios e tarefas, dependências, exclusões e perguntas pendentes.
4. Ausência de segredos, comandos fictícios apresentados como existentes e afirmações de testes não executados.
5. Arquivos alterados dentro do escopo autorizado; conteúdo anterior preservado.

## Encerrar uma tarefa

Registre arquivos alterados, CAs cobertos ou indicação de tarefa documental/pré-requisito, comandos e diretórios, resultados reais, impedimentos e próximo passo exato. Use `passou`, `falhou`, `não executado` ou `não aplicável`, com justificativa. Marque `[x]` somente com todas as verificações aplicáveis aprovadas.

Ausência de runner ou teste de um CA impede concluir a tarefa de implementação correspondente. Não substitua essa evidência por lint/build. Concluir a redação de documentos não aprova a spec ou o plano nem comprova a funcionalidade.

## Encerrar uma spec

Siga `rules/spec-flow.md`: tarefas concluídas, checks aprovados, verificação independente por `agents/verificador-spec.md`, veredito PRONTA e aprovação humana. Sem intervalo de commits local disponível, informe a lista de arquivos ou todo o escopo da spec; não crie commits para obter um intervalo. A verificação não autoriza publicação.
