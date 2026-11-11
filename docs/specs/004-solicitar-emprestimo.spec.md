# 004 — Solicitar empréstimo

Status: comportamento aprovado em 10/11/2026.

## Objetivo e vínculo

Permitir que a pessoa autenticada solicite um equipamento disponível e acompanhe seus empréstimos em aberto, conforme o [PRD](../../rules/PRD.md), o [ADR-001](../adr/001-stack.md) e o [ADR-002](../adr/002-design-system.md). A funcionalidade depende do [login](001-login.spec.md), da [leitura do catálogo](002-catalogo-leitura.spec.md) e dos [dados iniciais](003-dados-iniciais.spec.md).

## Regras

1. O catálogo exibe foto, nome, categoria, situação e crédito com link para o Pixabay. Equipamentos em manutenção e emprestados aparecem com sua situação e sem ação habilitada de solicitar.
2. A solicitação de um item disponível cria o empréstimo imediatamente. O servidor identifica a pessoa e a organização pela sessão. A gravação do empréstimo e a mudança de situação do equipamento acontecem na mesma transação.
3. A pessoa pode ter até cinco empréstimos em aberto simultaneamente. A solicitação é recusada se ela já atingiu esse limite ou se tem empréstimo em atraso. A interface informa o motivo da recusa.
4. A devolução está prevista para o 14º dia útil após a solicitação. Contar a partir da data seguinte, pulando sábados, domingos e feriados nacionais, estaduais e municipais de São Paulo. Exibir somente a data. Um item em aberto passa a estar em atraso quando começa o dia seguinte à data prevista no fuso de São Paulo.
5. Em **Meus empréstimos**, a pessoa vê os próprios empréstimos em aberto, inclusive os atrasados, e suas datas previstas de devolução.

## Critérios de aceitação

| ID | Condição, ação e resultado observável |
| --- | --- |
| CA-01 | Dado o inventário inicial, ao abrir o catálogo autenticado, a tela mostra os 12 itens com fotos, nome, categoria, situação e crédito com link para o Pixabay. |
| CA-02 | Dado um item disponível e uma pessoa elegível, ao solicitar, um empréstimo é criado e o equipamento passa a constar como emprestado. |
| CA-03 | Dado um item em manutenção ou emprestado, ao tentar solicitar pela interface ou diretamente pelo procedimento, a solicitação é impedida e nenhum empréstimo é criado. |
| CA-04 | Dada uma pessoa com cinco empréstimos em aberto e nenhum atraso, ao solicitar outro equipamento, a interface informa o limite e o equipamento permanece disponível. |
| CA-05 | Dada uma pessoa abaixo do limite e com empréstimo em aberto após o fim da data prevista, ao solicitar outro equipamento, a interface informa o atraso e o equipamento permanece disponível. No próprio dia de devolução, o empréstimo ainda está dentro do prazo. |
| CA-06 | Dadas duas solicitações concorrentes para o mesmo equipamento disponível, apenas uma cria um empréstimo e o item fica emprestado. |
| CA-07 | Dada uma pessoa com quatro empréstimos em aberto e dois pedidos concorrentes para itens diferentes, apenas um é aceito e a pessoa fica com cinco empréstimos em aberto. |
| CA-08 | Dada uma solicitação cujo prazo atravessa fim de semana e feriados de São Paulo, a data exibida corresponde ao 14º dia útil contado a partir do dia seguinte à solicitação. |
| CA-09 | Dados empréstimos próprios, de outra pessoa da mesma organização e de outra organização, **Meus empréstimos** exibe apenas os empréstimos próprios em aberto, com a data prevista. |
| CA-10 | Dado um pedido sem sessão ou para um equipamento de outra organização, a chamada ao procedimento é recusada sem criar empréstimo nem alterar o equipamento. |

## Fora de escopo e decisões pendentes

Registro da devolução, aprovação de Operações, fila de espera, reserva futura, renovação e notificação por e-mail ficam fora da entrega. A fonte e a atualização do calendário de feriados ficam para o plano técnico.

## Contrato afetado

Catálogo, seção **Meus empréstimos**, procedimentos tRPC protegidos, serviço de empréstimo e persistência no PostgreSQL. A devolução física é feita no Balcão de Suporte TI.
