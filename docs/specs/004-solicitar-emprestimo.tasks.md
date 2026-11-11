# Tarefas propostas — 004 Solicitar empréstimo

Status: execução local e verificação independente registradas no ENTREGA.md.

- [x] **EM-01 — Revisar a migração de empréstimos.** Pré-requisito de CA-02 a CA-07. Após DI-01, documentar o DDL para ajustar limite, atraso, triggers e garantia de um empréstimo aberto por item. Conferir o impacto em dados anteriores e fechar a interpretação de `due_at`. Apresentar o DDL para revisão.
- [x] **EM-02 — Implementar e validar a migration local.** Pré-requisito de CA-02 a CA-07. Após EM-01 e aprovação do DDL, testar em banco descartável a preservação das linhas existentes, a proteção por organização e a restrição de unicidade proposta.
- [x] **EM-03 — Implementar o cálculo de prazo e atraso.** CA-05 e CA-08. Em módulo de servidor, definir o calendário com fontes oficiais, o cálculo dos 14 dias úteis e o início do atraso. Testar fim de semana, feriados, virada de ano e fim da data prevista com relógio controlado.
- [x] **EM-04 — Implementar a solicitação.** CA-02, CA-03, CA-04, CA-05, CA-06, CA-07 e CA-10. Após EM-02, EM-03 e a base de login, criar service e procedimento protegido. Usar PostgreSQL real para testar duas solicitações concorrentes ao mesmo item e dois pedidos ao mesmo tempo para uma pessoa com quatro empréstimos. Nas recusas, conferir que o equipamento e o número de empréstimos foram preservados.
- [x] **EM-05 — Implementar a consulta dos próprios empréstimos.** CA-09. Após a base de login e de persistência, implementar service e procedimento de leitura. Testar registros devolvidos, atrasados, de outras pessoas e de outra organização.
- [x] **EM-06 — Integrar catálogo e Meus empréstimos.** CA-01, CA-02, CA-03, CA-04, CA-05, CA-08 e CA-09. Após a leitura da spec 002, DI-05, EM-04 e EM-05, integrar fotos, crédito, ações e mensagens de recusa. Testar a mudança de situação, a data exibida e a atualização dos dados pelo fluxo da tela.
- [x] **EM-07 — Verificar a spec e produzir a evidência da prática.** Após EM-06, rodar os checks, delegar a verificação em contexto limpo e registrar a tabela por CA. Fazer a prova do erro plantado em ambiente local, restaurar o comportamento aprovado e registrar a nova rodada.

Usar [as regras de checks](../../rules/checks.md) e [de testes](../../rules/tests.md). Os comandos de verificação estão nas regras de checks.
