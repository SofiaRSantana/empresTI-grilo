# Handoff — EmpresTI

Atualizado em: 05/11/2026 (America/Sao_Paulo).
Estado: documentação inicial criada; nenhuma implementação autorizada ou iniciada nesta sessão.

## Objetivo e trabalho realizado

Foram lidos os AGENTS, a documentação do projeto e o material `../materiais grilo/aula11-subagentes.html`. A partir da comparação, foram criados:

- `rules/tests.md`: convenções de testes, evidência por CA e ambiente local isolado.
- `rules/checks.md`: comandos realmente existentes, checks documentais e condições de conclusão.
- `docs/specs/001-login.spec.md`, `docs/specs/001-login.plan.md` e `docs/specs/001-login.tasks.md`.
- `docs/specs/002-catalogo-leitura.spec.md`, `docs/specs/002-catalogo-leitura.plan.md` e `docs/specs/002-catalogo-leitura.tasks.md`.

As specs e planos são rascunhos para revisão do time. Há 12 CAs propostos e 11 tarefas não concluídas. Criar os documentos não aprovou comportamentos, planos, infraestrutura ou implementação. Este handoff também não concede essas aprovações.

## Etapa e tarefa atuais

Preparação documental concluída. Próxima tarefa proposta: **L-01 — Revisar contrato**, em `docs/specs/001-login.tasks.md`. Não iniciada nem marcada como concluída. Depois da revisão do login, tratar **C-01 — Revisar contrato do catálogo**, em `docs/specs/002-catalogo-leitura.tasks.md`.

## Estado observado do aplicativo

- Aplicativo Next.js em `frontend/`, com login e catálogo demonstrativos.
- `frontend/lib/empres-ti-store.ts` mantém dados e sessão em localStorage; isso não comprova autenticação ou persistência no servidor.
- O catálogo também simula empréstimo; a spec 002 trata somente leitura e não aprova essa mutação. Inventariar o acoplamento antes de integrar dados reais.
- O pacote inspecionado possui scripts dev, build, start e lint; não possui script de testes nem dependências da stack de testes prevista no ADR.
- Camada tRPC/Prisma, ambiente de testes isolado e produção não foram comprovados. Não inferir prontidão a partir dos ADRs.

## Decisões e pendências

Login (`docs/specs/001-login.spec.md`):

- D-01: conta sem membership e seleção para usuários com múltiplos tenants.
- D-02: destino após login e comportamento/mensagens de erro.
- D-03: duração, expiração e renovação da sessão.
- D-04: identidades locais sintéticas e prova do cookie HttpOnly no fluxo tRPC/SSR.

Catálogo (`docs/specs/002-catalogo-leitura.spec.md`):

- D-01: manutenção aparece como indisponível no catálogo geral ou fica oculta?
- D-02: campos dos cards e permissão para ver dados do tomador/local/prazo.
- D-03: ordenação, paginação, busca e filtros do primeiro recorte.
- D-04: textos de vazio/erro e opção de repetir consulta.

Pendências transversais:

- Resolver com o time o conflito entre Supabase CLI em `rules/migration.md` e Prisma Migrate no ADR-001 antes de qualquer tarefa de schema; há placeholders na regra de migration.
- Registrar a divergência entre estilos inline nas notas de `layout.md` e Tailwind/tokens centralizados nos ADRs antes da etapa afetada. Não alterar ADR pelo time.
- Configurar testes em tarefa aprovada e registrar seus comandos reais em `rules/checks.md`; somente lint/build estão disponíveis hoje. Os avisos históricos sobre ausência de rules/tests.md e rules/checks.md em spec-flow e no verificador referem-se à época de criação; esses dois arquivos agora existem.
- Foram criadas `skills/empresti-revisar-codigo/SKILL.md` e `skills/empresti-nocturne/SKILL.md`, com seleção por tarefa documentada no AGENTS. Não foram encontradas configuração MCP no repositório ou registros das quatro provas da aula 11. Configurações externas não foram auditadas.
- O verificador existe em `agents/verificador-spec.md`, com referências no AGENTS e no spec-flow. Não foi acionado: não há spec implementada com testes para declarar pronta.

## Verificações realizadas e limites

- Conferidos os oito arquivos criados contra o conteúdo preparado, sua gravação, referências-base existentes, sequência de CAs e tarefas desmarcadas.
- Conferidos os arquivos das specs. Por orientação do usuário, os seis documentos foram reorganizados diretamente em `docs/specs/`, sem subpastas; referências no fluxo, no verificador e neste handoff foram atualizadas.
- As duas skills tiveram referências locais conferidas e passaram no quick_validate.py da skill-creator, executado com Python em modo UTF-8 nesta sessão. Não houve avaliação comportamental independente nem comprovação de registro automático pela ferramenta.
- Não executados lint/build ou testes da aplicação: trabalho exclusivamente documental; nenhuma evidência funcional foi produzida.
- Nenhuma instalação, alteração de código, migration, seed, reset, operação remota, deploy ou alteração de Git foi realizada.
- Nenhuma tentativa de implementação ou execução de testes falhou: essas etapas não foram iniciadas. A leitura conjunta inicial da documentação teve saída truncada, complementada por leituras em partes.

## Retomada: próximo passo exato

1. Reler `AGENTS.md`, `rules/restrictions.md`, `rules/spec-flow.md`, `rules/tests.md`, `rules/checks.md` e os ADRs; conferir os arquivos atuais, pois este handoff é um retrato da sessão.
2. Abrir `docs/specs/001-login.spec.md` e apresentar D-01 a D-04 ao time para resolver **L-01**. Registrar decisões e ajustar os CAs sem inventar respostas.
3. Após revisão do comportamento, revisar `docs/specs/001-login.plan.md` e `docs/specs/001-login.tasks.md` com o time. Antes da infraestrutura, detalhar L-02 em tarefas pequenas, com escopo final de arquivos e verificação.
4. Tratar C-01 e dependências do catálogo; executar somente a tarefa de implementação especificamente autorizada, seguindo o ritmo do projeto.
5. Ao concluir futuramente uma spec e seus checks, delegar a verificação em contexto limpo com o caminho da spec e o escopo completo disponível localmente. Quem corrige é o principal; PRONTA exige evidências e aprovação humana.

## Restrições que continuam vigentes

Um aplicativo, um banco e um deploy conforme ADR-001; nenhuma arquitetura paralela. Tenant vem da sessão/contexto, nunca do input. Não criar branch, commits, push, merge, fetch ou sincronizar histórico nesta sessão. Não operar Supabase remoto nem publicar. Não executar testes com destino de banco desconhecido ou remoto. Nunca exibir segredos.
