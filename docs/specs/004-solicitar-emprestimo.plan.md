# Plano técnico — 004 Solicitar empréstimo

Status: aprovado para execução, com a migration aprovada separadamente.

## Dependências

Usar a sessão e o contexto da [spec 001](001-login.spec.md), a leitura da [spec 002](002-catalogo-leitura.spec.md) e o inventário da [spec 003](003-dados-iniciais.spec.md). A spec 004 resolve a visibilidade dos itens em manutenção e os campos mínimos do catálogo. As demais decisões abertas da spec 002 precisam ser fechadas na revisão correspondente.

Antes de alterar o schema, aprovar a linha de base Prisma Migrate da tarefa DI-01. Revisar a função SQL que bloqueia no terceiro item, o cálculo de atraso e o trigger que sincroniza a situação do equipamento. Propor DDL que alinhe essas regras à spec e preserve os empréstimos existentes, as relações por organização e o RLS. Levantar se há registros em aberto incompatíveis com a restrição proposta antes de aplicá-la.

## Implementação proposta

- **Procedimentos.** Criar `loan.request` e `loan.listMine` no router tRPC. Validar a entrada com Zod e usar `tenantProcedure`. O identificador da pessoa e da organização vêm do contexto. A consulta de empréstimos filtra pela pessoa e organização e retorna apenas os dados necessários à tela.
- **Serviço e banco.** Em um serviço de empréstimos no servidor, calcular o prazo e conferir disponibilidade, limite e atraso dentro da transação que cria o empréstimo e muda a situação do item. Propor transação serializável com repetição limitada para conflitos de serialização e índice único parcial para impedir dois empréstimos em aberto do mesmo equipamento. Definir na migration como o serviço e o trigger existente dividem a atualização da situação, de modo que haja uma única gravação dessa transição. Ao esgotar as tentativas, retornar erro tratável pela tela.
- **Calendário.** Calcular por datas civis no fuso `America/Sao_Paulo`, com uma lista versionada de feriados nacionais, estaduais e municipais, fontes oficiais e cobertura explícita por ano. Conferir os anos necessários antes da publicação. Usar o mesmo marco de fim da data prevista na checagem de atraso e testar solicitações perto da meia-noite, feriados e virada do ano. Antes da migration, definir como interpretar vencimentos que já estejam gravados em `due_at`.
- **Interface.** Em `frontend/app/catalogo/`, usar TanStack Query via tRPC e os componentes do catálogo existente, seguindo o Nocturne. Após uma solicitação, atualizar as consultas de catálogo e empréstimos. Em caso de recusa, exibir a razão retornada pelo servidor. Remover o caminho demonstrativo de solicitação na integração desta spec.

## Verificação

Usar `createCaller` com PostgreSQL real e descartável para mutação, isolamento e concorrência. Executar concorrência com conexões distintas e conferir o estado final no banco. Usar testes controlados por relógio para calendário e atraso. Testing Library e Playwright cobrem catálogo, mensagens de recusa e **Meus empréstimos**. Os testes citam os IDs da spec. Depois dos checks, delegar a revisão e registrar a prova do erro plantado.
