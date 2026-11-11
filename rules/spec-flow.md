---
description: Ciclo de uma spec do EmpresTI, da definição do comportamento à verificação independente. Leia antes de criar, planejar, implementar, alterar ou declarar pronta uma spec.
globs: ["docs/specs/**"]
alwaysApply: false
---

# Fluxo de specs — EmpresTI

> Leitor: agente principal. Este arquivo define o procedimento; decisões de produto e aprovação continuam com o time.

## Quando aplicar

Leia este arquivo ao iniciar ou retomar uma funcionalidade, planejar sua implementação, mudar comportamento existente ou avaliar se uma spec está pronta. O fluxo é:

**PRD → spec → plano → tarefas → código e testes → verificação independente → aprovação humana.**

Não implemente funcionalidade a partir somente do chat ou do PRD. A spec resolve as ambiguidades de comportamento; o plano explica como implementá-la; as tarefas dividem o trabalho em unidades verificáveis.

Este procedimento não autoriza operações de git, banco ou produção que as restrições do projeto proíbem.

## Contexto e fontes de verdade

Antes de trabalhar, leia:

1. `AGENTS.md` e os `AGENTS.md` dos diretórios envolvidos.
2. `rules/restrictions.md`.
3. `rules/PRD.md`.
4. `docs/adr/001-stack.md` e os demais ADRs aplicáveis, incluindo `docs/adr/002-design-system.md` para interface.
5. A spec em questão, seu plano e suas tarefas, se já existirem.
6. `rules/tests.md` antes de escrever ou alterar testes e `rules/checks.md` antes de encerrar uma tarefa, quando disponíveis.

O EmpresTI é um monólito em Next.js App Router: front e servidor pertencem ao mesmo aplicativo em `frontend/`, no mesmo repositório. Não crie API, deploy ou repositório separado. Preserve a arquitetura definida nos ADRs e confirme o que está realmente implementado; documentação de stack não prova infraestrutura pronta.

- O PRD define a intenção do produto; a spec define o comportamento verificável da funcionalidade.
- Os ADRs registram decisões arquiteturais; não os escreva nem altere por conta própria.
- O código deve atender à spec vigente. Se uma regra de procedimento contrariar a spec ou um ADR, pare a etapa afetada, apresente o conflito e espere decisão do time.
- Plano e tarefas derivam da spec. Handoff registra o estado da sessão e não substitui nenhum desses documentos.

## 1. Delimitar a funcionalidade e esclarecer decisões

Escolha um recorte do PRD e justifique-o em uma linha. Uma spec deve caber em um ciclo curto de trabalho, sem reunir funcionalidades independentes.

Antes de redigir o contrato, liste perguntas que mudem o comportamento e classifique-as como negócio, técnica ou fora de escopo. Não responda ambiguidades do PRD por conta própria; apresente-as ao time. Decisões pendentes devem aparecer como não decididas e bloquear as tarefas que dependem delas.

No EmpresTI, confira no PRD o limite vigente, a contagem dos dias úteis, o bloqueio por atraso e a indisponibilidade em manutenção. A spec deve fechar as questões de comportamento que estiverem em aberto.

Reserva futura, notificação por e-mail e importação da planilha estão fora da primeira versão do PRD. Não as inclua silenciosamente.

## 2. Escrever e revisar a spec

Use arquivos diretamente em `docs/specs/`, sem subpastas por funcionalidade:

```text
docs/specs/
  <NNN-nome>.spec.md
  <NNN-nome>.plan.md
  <NNN-nome>.tasks.md
```

Escolha o próximo número disponível após consultar os arquivos existentes em `docs/specs/`. Não sobrescreva a spec nem o plano de outra funcionalidade. Os três arquivos usam o mesmo prefixo `<NNN-nome>` e ficam diretamente em `docs/specs/`; não reúna todos os planos em um documento global.

O `<NNN-nome>.spec.md` deve conter:

1. **Objetivo:** o que a pessoa passa a conseguir fazer.
2. **Vínculo:** seção do PRD e ADRs que restringem a funcionalidade.
3. **Regras:** decisões fechadas e numeradas, incluindo entradas, estados, permissões, erros e bordas relevantes.
4. **Critérios de aceitação:** IDs estáveis como `CA-01`, `CA-02`; cada um com condição, ação e resultado observável, verificável por teste.
5. **Fora de escopo / não decidido:** exclusões, motivos e perguntas ainda abertas.
6. **Contrato afetado:** telas, procedimentos tRPC, entidades ou tabelas envolvidos, e comportamentos que precisam ser preservados.

Quando útil, escreva os CAs como "Quando <gatilho e condição>, o sistema deve <resultado>" ou "Dado / Quando / Então". Evite "funciona corretamente", "é seguro" ou "é intuitivo" sem uma condição mensurável. Não transforme detalhes internos de implementação em requisitos de produto sem necessidade.

Mantenha os IDs dos CAs estáveis ao evoluir a spec e cite o caminho da spec para distinguir IDs iguais em funcionalidades diferentes.

Apresente a spec ao time e espere sua revisão antes de avançar para implementação. Não trate texto gerado pelo agente como decisão aprovada. Dependências de infraestrutura devem ser apontadas, não declaradas prontas sem prova.

## 3. Derivar plano e tarefas

Com o comportamento revisado, escreva `<NNN-nome>.plan.md` e `<NNN-nome>.tasks.md` diretamente em `docs/specs/`, com o mesmo prefixo da spec, sem implementar código.

O plano deve descrever a abordagem, contratos, camadas, arquivos previstos, dependências, riscos e estratégia de testes. Respeite os ADRs: tRPC como caminho de API, validação e autorização no servidor, regras de negócio em services e acesso a dados via Prisma. Para telas, siga o ADR-002 e `layout.md`.

Cada tarefa deve ter:

- Identificador, ordem e dependências.
- CA atendido, ou indicação explícita de que é pré-requisito de outro trabalho.
- Escopo de arquivos e mudança esperada.
- Testes e forma concreta de verificar o resultado, incluindo comando e diretório quando definidos.
- Checkbox `[ ]`, alterado para `[x]` somente depois dos checks aplicáveis aprovados.

Uma tarefa deve ser pequena o suficiente para revisão independente e, quando operações de git estiverem autorizadas, um commit próprio. Não crie commits para satisfazer essa convenção enquanto `AGENTS.md` proibir alterações de histórico.

Apresente o plano e as tarefas e espere aprovação. Se faltar uma decisão arquitetural, descreva a decisão e as alternativas; não escolha biblioteca fora dos ADRs nem escreva ADR pelo time.

## 4. Implementar uma tarefa por vez

Após a liberação, execute somente a tarefa autorizada. "Pode implementar" não libera o plano inteiro: conclua uma tarefa, rode os checks, mostre o resultado e pare, conforme `rules/restrictions.md`.

- Leia `rules/tests.md` antes de escrever testes. Cada teste que prova um CA deve citar explicitamente seu ID no nome e conter asserções que comprovem o resultado exigido.
- Derive os testes dos CAs, incluindo negativas, limites e erros. Verifique que uma falha inicial, quando usada, corresponde ao comportamento ausente, não a erro de ambiente.
- Aplique as ferramentas previstas no ADR-001: Vitest, Testing Library, `createCaller` para procedimentos e Playwright para fluxos-chave, conforme o escopo e a infraestrutura aprovada.
- Para procedimentos que acessam dados, cubra o isolamento entre tenants: dados do tenant A não podem ser acessados pelo tenant B. Tenant vem da sessão/contexto, nunca do input do cliente.
- Não confunda login demonstrativo ou armazenamento no navegador com autenticação, autorização ou persistência no servidor.
- Não altere arquivo fora da tarefa nem introduza funcionalidades não pedidas. Uma mudança de requisito volta primeiro à spec.

Antes de marcar `[x]`, execute os checks de `rules/checks.md` e a validação específica da tarefa. Registre comandos, diretórios e resultados reais; confira regressões, escopo e aderência aos ADRs. Se houver falha, bloqueio ou validação não executada, informe a causa e não declare a tarefa concluída.

O relato da tarefa deve informar arquivos alterados, CAs cobertos, verificações executadas, pendências e o próximo passo exato. A conclusão de uma tarefa não equivale à conclusão da spec.

## 5. Tratar pendências de infraestrutura e segurança

`rules/tests.md` define como escrever testes; `rules/checks.md` define o que executar para encerrar cada tarefa. Este arquivo não mantém uma segunda lista de checks.

Confira em `rules/checks.md` quais runners e scripts existem para o escopo. Registre a infraestrutura ausente como pendência e execute apenas os checks aplicáveis.

Tarefas de banco devem usar ambiente local. O verificador nunca prepara o banco, executa migrations, seed ou reset, nem toca no Supabase remoto. O agente principal também deve obedecer às aprovações e restrições aplicáveis antes de qualquer operação.

Use o Prisma Migrate conforme o ADR-001 e `rules/migration.md`. Apresente o DDL para revisão antes de gerar novas migrations.

A verificação e a aprovação de uma spec não autorizam push, deploy, alteração da Vercel ou operação no banco remoto. Respeite as restrições vigentes, independentemente de o site já estar publicado.

## 6. Manter e retomar a spec

A spec continua sendo a referência do comportamento após a entrega. Preserve o plano executado e as tarefas; não apague os artefatos nem sobrescreva outra funcionalidade.

Se o comportamento mudar, atualize primeiro a spec com a decisão do time, revise o impacto em outras specs e contratos, ajuste plano e tarefas afetados e só então altere código e testes. Para uma reformulação maior, discuta com o time se haverá nova spec referenciando a anterior. Não escolha essa convenção silenciosamente.

Ao interromper a sessão, deixe um handoff curto com caminho da spec, tarefa atual, decisões ainda pendentes, verificações realizadas, tentativas que falharam e próximo passo exato. Na retomada, confira os arquivos atuais; o handoff não aprova decisões nem substitui evidência.

## 7. Preparar a verificação independente

Quando todas as tarefas estiverem concluídas e os checks aprovados, reúna o caminho da spec e o intervalo de commits locais que delimita sua implementação. O intervalo precisa incluir todo o escopo e estar disponível sem fetch. Mudanças não commitadas precisam ser explicitamente identificadas; não apresente um intervalo que as omita.

Não crie commits ou altere histórico somente para preparar a verificação. Se não houver intervalo disponível, informe a limitação e passe uma lista completa de arquivos ou "tudo que implementa esta spec", alternativas aceitas por `agents/verificador-spec.md`.

Use contexto limpo: o verificador recebe as entradas pedidas no arquivo dele e lê as instruções do repositório, sem herdar a conversa de implementação. Se o harness não tiver subagentes, siga o plano alternativo do `AGENTS.md`: sessão nova iniciada com "Aja conforme agents/verificador-spec.md." e as entradas.

Devolva a tabela do verificador ao time. Se houver pendência, o agente principal reabre as tarefas correspondentes, corrige dentro do fluxo aprovado, executa os checks e solicita nova verificação com contexto limpo. O verificador não corrige o próprio achado.

Um veredito PRONTA comprova a verificação técnica; apresente-o para aprovação humana. Não confunda esse resultado com autorização para publicar.

## Fontes deste procedimento

Adaptado dos materiais em `../materiais grilo/`, pasta irmã da raiz do EmpresTI: aulas 1 (validação e passos pequenos), 2 (instruções e revisão de plano), 3 (contexto e handoff), 4 (PRD, ADR e checks), 6 (restrições e SDD), 7 (spec → plan → tasks, IDs e manutenção), 8 (ordem e infraestrutura) e 11 (verificação por subagente). Os exemplos de outras stacks dos materiais não redefinem os ADRs do EmpresTI.

## Antes de declarar uma spec pronta
- Delegue ao subagente verificador-spec (agents/verificador-spec.md),
  passando o caminho da spec e o intervalo de commits.
- A spec só é pronta com "Veredito: PRONTA". Qualquer outro resultado
  volta para as tarefas — quem corrige é o agente principal, nunca o
  verificador.
