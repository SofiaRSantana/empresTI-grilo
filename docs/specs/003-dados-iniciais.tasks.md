# Tarefas propostas — 003 Dados iniciais

Status: proposta para revisão.

- [x] **DI-01 — Definir o schema e a linha de base.** Pré-requisito de CA-01 a CA-04. Confirmar organização, categoria Cabo e histórico de migrations. Apresentar DDL, estratégia para banco existente e atualização da regra de migrations. Verificar o plano contra o SQL local, o ADR-001 e os dados que precisam ser preservados.
- [x] **DI-02 — Implementar a skill de imagens.** CA-02 e CA-05. Escopo em `skills/imagens-equipamentos/`, scripts de preparação e dependência Sharp. Testar dimensões, manifesto incompleto e ID duplicado com arquivos locais. Depende da aprovação deste plano.
- [x] **DI-03 — Preparar o lote de 12 fotos.** CA-02 e CA-05. Após DI-02, selecionar e processar o lote do briefing, com revisão visual e registro de rejeições. Conferir que há uma foto válida e rastreável por patrimônio.
- [x] **DI-04 — Implementar e aplicar a migration em ambiente local.** Pré-requisito de CA-01 a CA-04. Após DI-01 e a aprovação do DDL, versionar o schema no Prisma Migrate. Provar aplicação em banco descartável e preservação das restrições e políticas aplicáveis.
- [x] **DI-05 — Implementar a carga de equipamentos e fotos.** CA-01, CA-02 e CA-04. Após DI-03 e DI-04, criar o script de carga. Validar em PostgreSQL e Storage locais os 12 registros e URLs públicas. Repetir a operação após mudar a situação de um item e conferir que ela é preservada.
- [x] **DI-06 — Implementar o provisionamento da conta.** CA-03 e CA-04. Após DI-04 e a base de login da spec 001, criar o fluxo de provisionamento. Usar conta sintética para provar login, papel, organização, zero empréstimos e reexecução sem duplicidade.
- [ ] **DI-07 — Verificar a spec e preparar a publicação.** Após DI-05 e DI-06, rodar os checks aplicáveis, delegar a verificação independente e registrar as evidências por CA. Preparar instruções de publicação e conferência para a etapa autorizada.

Usar [as regras de checks](../../rules/checks.md) e [de testes](../../rules/tests.md). Os comandos de testes serão registrados quando o runner for configurado.
