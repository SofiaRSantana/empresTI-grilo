# PRD — Empréstimo de Equipamentos Internos
Versão 1 · escrito pelo time de Operações
 
## Problema
O controle de quem pegou qual equipamento (notebooks, monitores,
cabos, câmeras) é feito hoje numa planilha compartilhada. Ninguém
sabe o que está disponível, itens somem, e a devolução só é
registrada se alguém lembrar de atualizar a linha.
 
## Quem usa
- Colaborador: vê o catálogo, pede um item emprestado, devolve.
- Operações: cadastra equipamentos, vê quem está com o quê e
  registra devolução no balcão.
 
## O que precisa existir na primeira versão
1. Login. Cada pessoa vê os próprios empréstimos.
2. Catálogo de equipamentos com a situação de cada um.
3. Solicitar empréstimo de um item disponível.
4. Devolver um item que está comigo.
5. Tela de Operações com todos os empréstimos em aberto.
 
## Regras que Operações já decidiu
- Cada pessoa pode ter no máximo 5 empréstimos em aberto ao mesmo tempo.
- O prazo de devolução é de 14 dias úteis. A contagem começa no dia seguinte à solicitação e exclui sábados, domingos e feriados nacionais, estaduais e municipais aplicáveis à cidade de São Paulo.
- A pessoa pode devolver o item no Balcão de Suporte TI até o fim da data prevista, no horário local de São Paulo. Se o empréstimo continuar em aberto no dia seguinte, ele está em atraso.
- Quem tem item em atraso não pode pegar outro emprestado.
- Equipamento em manutenção não aparece como disponível.
 
## O que NÃO entra nesta versão
- Reserva com data futura.
- Notificação por e-mail.
- Importação da planilha atual.
 
## Como saberemos que deu certo
Operações consegue abandonar a planilha depois de duas semanas
de uso.
