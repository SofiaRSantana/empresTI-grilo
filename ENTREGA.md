# Entrega da prática EmpresTI

## Links

- [Repositório no GitHub](https://github.com/SofiaRSantana/empresTI-grilo)
- [Aplicação publicada na Vercel](https://empres-ti-grilo.vercel.app/login)
- [Projeto na Vercel](https://vercel.com/sofias-projects-3ec5cf86/empres-ti-grilo)

A versão da prática foi implementada localmente. A publicação desta versão, a conferência em produção e a tag `entrega-pratica` ainda estão pendentes.

## 1. Conflitos

| Pedido | Contrariava | Decisão e motivo | Registro |
| --- | --- | --- | --- |
| Limite de cinco empréstimos com prazo de 14 dias úteis | Limite anterior de três e prazo sem contagem de dias úteis | Atualizar o PRD antes de implementar, para manter interface, servidor e banco de acordo com a decisão aprovada | [PRD](rules/PRD.md), [spec 004](docs/specs/004-solicitar-emprestimo.spec.md), `3eb72ec` e `64294f5` |
| TI-0010 com situações diferentes nos briefings | Os exemplos de empréstimo divergem do inventário inicial | Adotar a situação Disponível da lista de dados iniciais, deixando TI-0004 e TI-0007 em manutenção | [Spec 003](docs/specs/003-dados-iniciais.spec.md), [carga do inventário](frontend/scripts/seed-equipment.mjs), `5dfea27` |
| Referências ao Pexels no material | Troca solicitada para Pixabay | Usar Pixabay como origem, com crédito no catálogo e dados de proveniência no manifesto | [Skill](skills/imagens-equipamentos/SKILL.md), [spec 003](docs/specs/003-dados-iniciais.spec.md), `2b989b1` |
| Credencial padrão de avaliação | Regras de proteção de segredos | Provisionar via ambiente protegido. Remover o arquivo de ambiente do controle de versão e prever rotação do segredo antes da publicação | [Provisionamento](frontend/scripts/provision-member.mjs), `158b7df` e `814c75d` |
| Uso de ferramentas do Supabase para o esquema | O ADR-001 dá ao Prisma Migrate a propriedade das migrations | Supabase continua hospedando PostgreSQL, Auth e Storage. Prisma Migrate versiona o esquema da aplicação e as políticas associadas | [ADR-001](docs/adr/001-stack.md), [migrations Prisma](frontend/prisma/migrations), `a4d4be3` e `ef6e955` |
| Corrigir o problema durante a verificação | A prática exige avaliação independente | O verificador só lê, testa e reporta. As correções ficam com a implementação e passam por nova rodada | [Verificador](agents/verificador-spec.md), `6daca9a` |

## 1b. Lacunas

| Spec | O que faltava | Alternativas | Decisão e motivo | Registro |
| --- | --- | --- | --- | --- |
| 003 | Local de retirada e devolução | Definir endereços por item ou usar um ponto comum | Balcão de Suporte TI para todos os itens, conforme confirmação | [Spec 003](docs/specs/003-dados-iniciais.spec.md), `5dfea27` |
| 003 | Categoria dos cabos e organização responsável | Agrupar em Acessório ou adotar Cabo no inventário da organização | Categoria Cabo. O catálogo e os vínculos são isolados pela organização da sessão | [Plano 003](docs/specs/003-dados-iniciais.plan.md), `6074e19` e `c1db99c` |
| 003 | Papel e finalidade das contas | Usar uma única conta de teste ou separar avaliação e validação | Professor como colaborador com zero empréstimos. Sofia confere a entrega publicada. Os testes locais usam contas sintéticas | [Spec 003](docs/specs/003-dados-iniciais.spec.md), `5409011` |
| 003 | Inscrições nos dois equipamentos difíceis de ilustrar | Manter a busca ou aprovar exceções pontuais | Aprovar os IDs 4607652 e 551287 pelos textos técnicos e legendas dos controles | [Spec 003](docs/specs/003-dados-iniciais.spec.md), `a5603c4` |
| 004 | Calendário e momento do atraso | Contar dias corridos, dias úteis nacionais ou o calendário local | Contar desde o dia seguinte, excluindo fins de semana e feriados nacionais, estaduais e municipais de São Paulo. A devolução pode ocorrer até o fim da data prevista no horário local | [Spec 004](docs/specs/004-solicitar-emprestimo.spec.md), `e1c659a` e `64294f5` |

## 2. Onde o agente tentou decidir

A revisão inicial aplicou literalmente o filtro de texto legível às fotos da webcam e da câmera, incluindo inscrições técnicas e legendas nos botões. As imagens ficaram reprovadas até Sofia avaliar os casos e aprovar duas exceções específicas. A regra geral e os dois IDs ficaram registrados na spec no commit `a5603c4`.

## 3. Decisão de arquitetura

Havia duas opções defensáveis para as migrations em um projeto que usa Supabase e Prisma. O Supabase CLI poderia controlar o esquema por SQL, ou Prisma Migrate poderia manter a sequência de alterações. O ADR-001 já atribui essa responsabilidade ao Prisma. A prática aplicou essa decisão à linha de base e preservou o SQL necessário para as políticas do Supabase. O procedimento foi ajustado no commit `a4d4be3`.

## 4. Skill de imagens

O [SKILL.md](skills/imagens-equipamentos/SKILL.md) define o fluxo, o gatilho e o limite de atuação. As [referências](skills/imagens-equipamentos/references) reúnem orientações de busca, licença e revisão. Os [scripts](skills/imagens-equipamentos/scripts) executam operações verificáveis, como processamento com Sharp, validação de dimensões, identificação de duplicatas e registro da proveniência. Pessoas, marcas, conteúdo de tela e legibilidade precisam de revisão visual.

A revisão inicial reprovou 28 candidatas. Duas foram aprovadas por exceção e 26 ficaram fora do lote. Os motivos incluíram marcas, texto legível, pessoas e tela com conteúdo. O lote final contém 12 JPEGs de 800 × 600.

A skill gera arquivos locais e manifesto. O envio exige o script separado de carga, as credenciais de operação e a confirmação da referência do projeto para destino remoto. A publicação é executada pela responsável pela entrega.

## 5. Subagente verificador

O [verificador](agents/verificador-spec.md) recebe a spec e o escopo em sessão separada. Ele lê as regras, ADRs, spec, plano e tarefas na versão local para comparar os critérios com os testes e o código efetivamente exercitado. Esse contexto independente evita que justificativas da implementação substituam evidências.

O verificador cobre o monólito Next.js desde a tela até os procedimentos tRPC, os serviços e o PostgreSQL. A execução usa banco descartável já preparado. O contrato do agente proíbe edição, commits, migrations e produção. A execução independente recebe configuração de teste local e nenhum segredo de produção.

## 6. Verificador em ação

Na execução principal, os 11 testes Vitest passaram no Supabase descartável, incluindo concorrência, recusa, isolamento e reexecução do inventário. Lint, TypeScript e a compilação Webpack da implementação passaram. A primeira execução Playwright atingiu o limite de espera durante a compilação inicial do catálogo. A espera do teste foi ajustada no commit `6daca9a`.

A prova de erro plantado está registrada no commit `7e0d0de`, que baixou temporariamente o limite do serviço de cinco para quatro. O verificador executou os testes sobre a cópia isolada desse commit. O limite de cinco foi restaurado no commit `78f8227`.

| CA da spec 004 | Evidência | Status na prova | Observação |
| --- | --- | --- | --- |
| CA-01 | `frontend/tests/e2e/catalog-and-loans.spec.ts:73` | SEM TESTE | O aplicativo no navegador pertencia a outro snapshot. |
| CA-02 | `frontend/src/server/api/loans.integration.test.ts:86` | ATENDIDO | Confirmou a gravação e o estado emprestado. |
| CA-03 | `frontend/src/server/api/loans.integration.test.ts:94` | SEM TESTE | As recusas no procedimento passaram. A interface não foi executada nesse snapshot. |
| CA-04 | `frontend/src/server/api/loans.integration.test.ts:104`, `frontend/src/server/services/loans.ts:32` | REPROVADO | O quinto pedido já recebeu `CONFLICT`. |
| CA-05 | `frontend/src/server/api/loans.integration.test.ts:113` | SEM TESTE | A recusa no servidor passou. A mensagem na interface não foi executada nesse snapshot. |
| CA-06 | `frontend/src/server/api/loans.integration.test.ts:130` | ATENDIDO | Um pedido concorrente para o mesmo item foi aceito. |
| CA-07 | `frontend/src/server/api/loans.integration.test.ts:148`, `frontend/src/server/services/loans.ts:32` | REPROVADO | Os dois pedidos concorrentes receberam `CONFLICT` quando um deveria ser aceito. |
| CA-08 | `frontend/src/server/services/loan-calendar.test.ts:5` | SEM TESTE | O cálculo passou. A data exata na tela ainda não tinha asserção. |
| CA-09 | `frontend/src/server/api/loans.integration.test.ts:156` | SEM TESTE | A consulta no servidor passou. A tela não foi executada nesse snapshot. |
| CA-10 | `frontend/src/server/api/loans.integration.test.ts:177` | ATENDIDO | Foram recusados pedidos sem sessão, sem vínculo e de outra organização. |

A primeira revisão da spec 003 encontrou um conflito no ADR-001. As linhas 45 e 49 registram o caminho `prisma/seed.ts` e o primeiro tenant `suporte_ti`. A implementação usa `frontend/scripts/seed-equipment.mjs` e a organização Instituto Germinare, aprovada na spec 001 no commit `c405a5b`. A reconciliação formal do ADR fica com o time.

### Spec 003 após os ajustes de evidência

| CA | Evidência | Status local |
| --- | --- | --- |
| CA-01 | `frontend/src/server/services/inventory.integration.test.ts`, carga em organização nova e conferência dos 12 patrimônios, nomes, categorias, situações e local | ATENDIDO |
| CA-02 | `frontend/tests/e2e/catalog-and-loans.spec.ts`, 12 imagens públicas com dimensões e hashes conferidos, IDs distintos e proveniência | ATENDIDO |
| CA-03 | `frontend/tests/e2e/catalog-and-loans.spec.ts`, papel de colaborador, login real e zero empréstimos com conta sintética | ATENDIDO |
| CA-04 | `frontend/src/server/services/inventory.integration.test.ts` e `frontend/tests/e2e/catalog-and-loans.spec.ts`, reexecução preserva IDs, vínculo, objetos e situação operacional | ATENDIDO |
| CA-05 | `skills/imagens-equipamentos/scripts/fotos.test.mjs`, rejeição de dimensão inválida, proveniência ausente e ID repetido | ATENDIDO |

O verificador executou lint, dois testes Playwright, o teste de inventário e três testes da skill. A primeira execução do teste de inventário sob carga simultânea excedeu 15 segundos. O teste passou na repetição e ganhou um tempo de espera próprio em `b5defd9`. A tarefa DI-07 foi registrada como executada após o relatório. O veredito formal foi **NÃO PRONTA** pela divergência do ADR-001 e porque o verificador não repetiu a compilação de produção.

### Spec 004 após a restauração

| CA | Evidência | Status local |
| --- | --- | --- |
| CA-01 | `frontend/tests/e2e/catalog-and-loans.spec.ts:74`, catálogo autenticado com 12 itens, fotos, campos e crédito | ATENDIDO |
| CA-02 | `frontend/src/server/api/loans.integration.test.ts:86` e `frontend/tests/e2e/catalog-and-loans.spec.ts:158`, gravação e mudança para emprestado | ATENDIDO |
| CA-03 | `frontend/src/server/api/loans.integration.test.ts:94` e Playwright, estados indisponíveis impedem a solicitação | ATENDIDO |
| CA-04 | `frontend/src/server/api/loans.integration.test.ts:103` e Playwright, quinto pedido aceito e sexto recusado com mensagem | ATENDIDO |
| CA-05 | `frontend/src/server/api/loans.integration.test.ts:113`, `frontend/src/server/services/loan-calendar.test.ts:12` e Playwright, atraso somente após a data prevista e mensagem de recusa | ATENDIDO |
| CA-06 | `frontend/src/server/api/loans.integration.test.ts:130`, apenas um pedido aceito para o mesmo item | ATENDIDO |
| CA-07 | `frontend/src/server/api/loans.integration.test.ts:144`, apenas um pedido aceito com quatro empréstimos em aberto | ATENDIDO |
| CA-08 | `frontend/src/server/services/loan-calendar.test.ts:5` e `frontend/tests/e2e/catalog-and-loans.spec.ts:158`, feriados e data exata na confirmação e na lista | ATENDIDO |
| CA-09 | `frontend/src/server/api/loans.integration.test.ts:156` e Playwright, lista somente os próprios empréstimos em aberto e exibe datas | ATENDIDO |
| CA-10 | `frontend/src/server/api/loans.integration.test.ts:177`, pedidos sem sessão ou de outra organização não alteram os dados | ATENDIDO |

O verificador confirmou lint, 11 testes Vitest e os dois cenários Playwright. Na primeira rodada de navegador, a asserção do limite também encontrou o aviso de navegação do Next.js. O seletor foi restringido às mensagens da aplicação no commit `ea2f386`. A repetição passou com os alertas de limite e atraso. O build Webpack passou na execução principal. O verificador conferiu o artefato e a identidade dos arquivos da aplicação, sem repetir o build. Veredito formal **PRONTA**.

## 7. Regra posta à prova

O projeto já pedia evidência dos critérios, mas o runner ainda não estava disponível. [Regras de checks](rules/checks.md), [testes](rules/tests.md) e [fluxo de specs](rules/spec-flow.md) passaram a especificar a execução local, os nomes dos testes com IDs de critérios e o registro de testes pulados. O commit `6daca9a` reúne essas mudanças.

## 8. Fora do escopo e publicação

Registro de devolução, renovação, fila, notificação e aprovação operacional ficaram para outra entrega. A devolução física ocorre no Balcão de Suporte TI. O Prisma não conseguiu comparar diretamente o esquema com `migrate diff` por causa das referências a `auth.users`. A aplicação das migrations e os testes SQL locais verificaram o esquema em uso.

O [calendário de feriados móveis](frontend/src/server/services/loan-calendar.ts) cobre 2026 e 2027. Inclua 2028 antes que o prazo de um empréstimo possa cruzar a virada de 2027 para 2028.

1. Rotacionar a credencial do Supabase que apareceu no histórico do Git e atualizar as referências protegidas. Confirmar que o banco de produção tem backup ou ponto de recuperação.
2. Em `frontend`, com `DATABASE_URL` e `DIRECT_URL` de produção no ambiente protegido, confirmar que o esquema público ainda está vazio. Se houver esquema legado, comparar o estado real com a linha de base conforme [a regra de migrations](rules/migration.md). No banco vazio, executar `npx prisma migrate deploy` e conferir `npx prisma migrate status`.
3. Configurar `SUPABASE_URL` e `SUPABASE_SECRET_KEY` apenas no ambiente protegido da operação. Com a pasta do lote final disponível, executar em `frontend` `node scripts/seed-equipment.mjs <manifesto.json> --project=kofzjnnvaxciwmhoyoxt`. O manifesto precisa ficar junto dos 12 JPEGs.
4. Provisionar Sofia e o professor como colaboradores com `node scripts/provision-member.mjs --project=kofzjnnvaxciwmhoyoxt`, preenchendo `EMPRESTI_ACCOUNT_EMAIL`, `EMPRESTI_ACCOUNT_NAME` e `EMPRESTI_ACCOUNT_PASSWORD` separadamente para cada conta, no ambiente protegido. Conferir zero empréstimos na conta de avaliação.
5. Na Vercel, conferir a raiz `frontend` e as variáveis `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_API_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Publicar o commit final.
6. Com a conta de Sofia, conferir login, 12 fotos com crédito, estados de manutenção, solicitação e prazo em **Meus empréstimos**. Preservar a conta do professor sem empréstimos. Após a conferência, publicar a tag `entrega-pratica` apontando para o commit entregue.
