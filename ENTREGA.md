# Entrega da prática EmpresTI

## Links

- [Repositório no GitHub](https://github.com/SofiaRSantana/empresTI-grilo)
- [Aplicação publicada na Vercel](https://empres-ti-grilo.vercel.app/login)

A versão da prática foi publicada e conferida na Vercel. A tag `entrega-pratica` ainda está pendente.

## 1. Conflitos

| Pedido | Contrariava | Decisão e motivo | Registro |
| --- | --- | --- | --- |
| Limite de cinco empréstimos com prazo de 14 dias úteis | Limite anterior de três e prazo sem contagem de dias úteis | Atualizar o PRD antes de implementar, para manter interface, servidor e banco de acordo com a decisão aprovada | [PRD](rules/PRD.md), [spec 004](docs/specs/004-solicitar-emprestimo.spec.md), `3eb72ec` e `64294f5` |
| TI-0010 com situações diferentes nos briefings | Os exemplos de empréstimo divergem do inventário inicial | Adotar a situação Disponível da lista de dados iniciais, deixando TI-0004 e TI-0007 em manutenção | [Spec 003](docs/specs/003-dados-iniciais.spec.md), [carga do inventário](frontend/scripts/seed-equipment.mjs), `5dfea27` |
| Credencial padrão de avaliação | Regras de proteção de segredos | Provisionar via ambiente protegido e remover o arquivo de ambiente do controle de versão | [Provisionamento](frontend/scripts/provision-member.mjs), `158b7df` e `814c75d` |
| Uso de ferramentas do Supabase para o esquema | O ADR-001 dá ao Prisma Migrate a propriedade das migrations | Supabase continua hospedando PostgreSQL, Auth e Storage. Prisma Migrate versiona o esquema da aplicação e as políticas associadas | [ADR-001](docs/adr/001-stack.md), [migrations Prisma](frontend/prisma/migrations), `a4d4be3` e `ef6e955` |
| Corrigir o problema durante a verificação | A prática exige avaliação independente | O verificador só lê, testa e reporta. As correções ficam com a implementação e passam por nova rodada | [Verificador](agents/verificador-spec.md), `6daca9a` |

## 1b. Lacunas

| Spec | O que faltava | Alternativas | Decisão e motivo | Registro |
| --- | --- | --- | --- | --- |
| 003 | Local de retirada e devolução | Definir endereços por item ou usar um ponto comum | Balcão de Suporte TI para todos os itens, conforme confirmação | [Spec 003](docs/specs/003-dados-iniciais.spec.md), `5dfea27` |
| 003 | Categoria dos cabos e organização responsável | Agrupar em Acessório ou adotar Cabo no inventário da organização | Categoria Cabo. O catálogo e os vínculos são isolados pela organização da sessão | [Plano 003](docs/specs/003-dados-iniciais.plan.md), `6074e19` e `c1db99c` |
| 003 | Papel e finalidade das contas | Usar uma única conta de teste ou separar avaliação e validação | Professor como colaborador com zero empréstimos. Sofia confere a entrega publicada. Os testes locais usam contas sintéticas | [Spec 003](docs/specs/003-dados-iniciais.spec.md), `5409011` |
| 003 | Inscrições nos dois equipamentos difíceis de ilustrar | Manter a busca ou aprovar exceções pontuais | Aprovar os IDs 4607652 e 551287 no lote inicial. Mais tarde, escolhi a foto ilustrativa 5095868 para a webcam | [Spec 003](docs/specs/003-dados-iniciais.spec.md), `a5603c4` e `7f9114a` |
| 004 | Calendário e momento do atraso | Contar dias corridos, dias úteis nacionais ou o calendário local | Contar desde o dia seguinte, excluindo fins de semana e feriados nacionais, estaduais e municipais de São Paulo. A devolução pode ocorrer até o fim da data prevista no horário local | [Spec 004](docs/specs/004-solicitar-emprestimo.spec.md), `e1c659a` e `64294f5` |

## 2. Onde o agente tentou decidir

Quando pedi para trocar as fotos, o agente viu as imagens novas em outra sessão e deu a troca como concluída. Na minha aba, o notebook de 14 polegadas ainda aparecia com a foto antiga e com as faixas brancas. Mostrei o que eu estava vendo e pedi a correção. O agente sugeriu recarregar a página, mas, quando ele conferiu na minha aba, a foto antiga continuou aparecendo após recarregar. Preferi resolver isso no catálogo, porque quem entra no portal precisa ver a foto nova sem ter que limpar o cache. A correção mudou o endereço das fotos substituídas. [Spec 003](docs/specs/003-dados-iniciais.spec.md), commit `d43af5f`.

## 3. Uma decisão que merece um ADR

- **Decisão.** Usar um endereço novo sempre que uma foto do catálogo for substituída. O nome no Storage inclui parte do SHA-256, um identificador que muda quando o arquivo muda. A ficha do equipamento passa a apontar para esse endereço.
- **Alternativa considerada.** Sobrescrever a imagem no endereço antigo manteria a troca mais simples, mas foi assim que o navegador continuou exibindo a versão anterior mesmo após recarregar.
- **Por que merece um ADR.** A escolha afeta o navegador, o Storage, o banco e o script de carga. Repetir a carga com o mesmo manifesto mantém o mesmo endereço. A contrapartida é que as versões antigas continuam no Storage até uma eventual limpeza.
- **Registro atual.** A decisão já está aplicada e registrada na spec. Um ADR próprio fica como proposta para registrar esse padrão para futuras trocas de fotos. [Spec 003](docs/specs/003-dados-iniciais.spec.md), [script de carga](frontend/scripts/seed-equipment.mjs), commit `d43af5f`.

## 4. Skill de imagens

- **O que ficou em cada parte.** Coloquei no `SKILL.md` a ordem do trabalho e os limites da skill. Deixei os detalhes da API, licença e critérios visuais em `references/`, para consultar durante a busca. O que dá para repetir do mesmo jeito a cada lote virou script. [Skill](skills/imagens-equipamentos/SKILL.md), [referência do Pixabay](skills/imagens-equipamentos/references/pixabay.md) e [script](skills/imagens-equipamentos/scripts/fotos.mjs).
- **O que o código garante e o que eu reviso.** O script usa Sharp para preparar os JPEGs de 800 × 600 e confere dimensões, duplicatas e proveniência. A revisão visual fica com uma pessoa, porque uma imagem pode cumprir todas essas checagens e ainda mostrar uma marca, texto legível ou conteúdo na tela. [Testes da skill](skills/imagens-equipamentos/scripts/fotos.test.mjs).
- **Como o envio fica separado.** O script da skill termina nos arquivos locais e no manifesto. O envio passa por um script de operação separado, que exige credenciais próprias e confirma a referência do projeto de destino. Autorizei a publicação em uma etapa separada da preparação e da verificação das fotos. [Script de carga](frontend/scripts/seed-equipment.mjs) e [configuração da operação](frontend/scripts/operation-config.mjs).
- **Fotos reprovadas.** Na revisão inicial, 28 candidatas foram reprovadas por motivos como marcas, texto legível, pessoas ou conteúdo de tela. Aprovei duas por exceção e 26 ficaram fora daquele lote. O catálogo publicado tem 12 fotos. As exceções da versão atual ficaram registradas conforme fiz novas escolhas. [Spec 003](docs/specs/003-dados-iniciais.spec.md), commits `a5603c4`, `6c7e9a7` e `cea7f83`.

## 5. Subagente verificador

- **Quando é acionado.** Depois da implementação das tarefas e antes de eu considerar a spec pronta. Nesse momento, o verificador já pode comparar o que foi pedido com o código e os resultados dos testes. [Instruções do verificador](agents/verificador-spec.md).
- **O que lê.** Em uma sessão separada, ele recebe o caminho da spec e o escopo. Lê as regras, os ADRs, o plano, as tarefas, os testes e o código no repositório. Assim, o resultado sai das evidências que ele encontra, sem depender da explicação de quem implementou. [Fluxo de specs](rules/spec-flow.md).
- **Limites da execução.** O contrato do subagente veda edição, commits, migrations e acesso à produção. A sessão recebe a configuração do ambiente descartável, sem credenciais de produção na entrada. Esses limites são instruções do agente e condições da execução. O ambiente compartilhado não oferece uma trava de permissões exclusiva para esse papel. [Instruções do verificador](agents/verificador-spec.md).
- **Como verifica o monólito.** O Playwright exercita a tela. O Vitest chama os procedimentos tRPC com `createCaller` e confere os efeitos das regras no PostgreSQL descartável. A conferência liga o que aparece no catálogo ao que o sistema registra no banco. [Regras de testes](rules/tests.md).

## 6. Verificador em ação

### Histórico das rodadas

- **Preparação.** O agente preparou o lote de 12 fotos, a carga repetível, as contas de colaborador e os testes de solicitação. Na execução principal passaram 11 testes Vitest, o lint, o TypeScript e a compilação Webpack. A primeira rodada de navegador demorou além do tempo previsto porque o catálogo ainda estava compilando. O tempo de espera foi ajustado em `6daca9a`.
- **Spec 003, inventário.** O verificador pediu provas dos 12 registros depois da primeira carga e dos mesmos identificadores de conta e vínculo depois da segunda. O teste de inventário também excedeu o tempo de espera quando rodou junto com o navegador. As verificações passaram depois que as asserções e a espera foram ajustadas em `b5defd9`. A primeira rodada ficou como **NÃO PRONTA** porque o ADR-001 ainda citava outro script e outra organização inicial, e o verificador não tinha repetido a compilação. Alinhei o ADR em `bfac152`. Na reavaliação, o verificador conferiu essa alteração e as evidências anteriores e deu o veredito **PRONTA**.
- **Spec 004, empréstimos.** Acrescentei a conferência da data exata na tela e corrigi o teste do sexto pedido, que encontrava tanto o aviso de limite quanto o anúncio de navegação do Next.js. Depois de restringir o seletor às mensagens do EmpresTI, o teste passou com os avisos de limite e atraso. O verificador aprovou os 10 critérios. Commits `b5defd9` e `ea2f386`.
- **O que ficou consolidado.** Na conferência em produção com a minha conta, o agente verificou os 12 itens com fotos, os itens em manutenção, cinco solicitações aceitas, o prazo em **Meus empréstimos** e a recusa do sexto pedido. Ele encerrou os cinco empréstimos de teste e conferiu que a conta do professor continuou com zero.
- **O que ficou sem comprovação ou para depois.** O verificador usou a evidência da compilação feita na execução principal. Depois da troca dos endereços das fotos, confirmei a exibição no site e a reexecução da carga em simulação. O teste de integração dessa mudança ficou pendente porque o Docker local estava desligado. As melhorias de devolução e da mensagem de limite ficaram para uma próxima implementação. [Ver seção 8](#8-o-que-ficou-de-fora-e-o-que-faria-diferente).

### Prova com erro plantado

- **Erro plantado.** Reduzi temporariamente o limite de cinco para quatro no commit `7e0d0de`. O verificador trabalhou com uma cópia isolada desse commit.
- **Resultado e restauração.** O verificador reprovou CA-04 e CA-07. Restaurei o limite de cinco no commit `78f8227`, e os testes desses critérios voltaram a passar. A tabela registra o que o verificador conseguiu comprovar na cópia com o erro.

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

### Tabela final da spec 003

- **Veredito.** PRONTA após o alinhamento do ADR-001 e a reavaliação das evidências. Commit `bfac152`.

| CA | Evidência | Status local |
| --- | --- | --- |
| CA-01 | `frontend/src/server/services/inventory.integration.test.ts`, carga em organização nova e conferência dos 12 patrimônios, nomes, categorias, situações e local | ATENDIDO |
| CA-02 | `frontend/tests/e2e/catalog-and-loans.spec.ts`, 12 imagens públicas com dimensões e hashes conferidos, IDs distintos e proveniência | ATENDIDO |
| CA-03 | `frontend/tests/e2e/catalog-and-loans.spec.ts`, papel de colaborador, login real e zero empréstimos com conta sintética | ATENDIDO |
| CA-04 | `frontend/src/server/services/inventory.integration.test.ts` e `frontend/tests/e2e/catalog-and-loans.spec.ts`, reexecução preserva IDs, vínculo, objetos e situação operacional | ATENDIDO |
| CA-05 | `skills/imagens-equipamentos/scripts/fotos.test.mjs`, rejeição de dimensão inválida, proveniência ausente e ID repetido | ATENDIDO |

### Tabela final da spec 004

- **Veredito.** PRONTA após a restauração do limite e a conferência no navegador.

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

## 7. Regra posta à prova

O projeto já pedia evidência dos critérios, mas o runner ainda não estava disponível. [Regras de checks](rules/checks.md), [testes](rules/tests.md) e [fluxo de specs](rules/spec-flow.md) passaram a especificar a execução local, os nomes dos testes com IDs de critérios e o registro de testes pulados. O commit `6daca9a` reúne essas mudanças.

## 8. O que ficou de fora e o que faria diferente

- **Avisar que devolvi o material.** Quero acrescentar em **Meus empréstimos** uma ação para o colaborador avisar que entregou o item no Balcão de Suporte TI. Hoje, o portal mostra o prazo e o local da devolução física.
- **Mensagem mais clara ao atingir o limite.** O sistema já bloqueia o sexto pedido. Quero explicar na tela, com palavras mais diretas, que só dá para ficar com cinco materiais emprestados ao mesmo tempo e que é preciso devolver um deles antes de pedir outro. [Mensagem atual](frontend/src/server/api/router.ts#L33).
- **Outros itens para uma próxima versão.** Renovação, fila de espera, notificações e aprovação operacional seguem fora do escopo da prática. [Spec 004](docs/specs/004-solicitar-emprestimo.spec.md).
- **Manutenção futura.** O calendário de feriados móveis cobre 2026 e 2027. Preciso incluir 2028 antes que um prazo possa cruzar a virada de 2027 para 2028. [Calendário](frontend/src/server/services/loan-calendar.ts).

As três migrations foram aplicadas no Supabase. A comparação direta com `prisma migrate diff` não funcionou por causa das referências a `auth.users`. O estado do esquema foi conferido pela aplicação das migrations e pelos testes SQL locais.
