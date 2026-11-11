# 002 — Consultar catálogo e disponibilidade

Status: rascunho para revisão do time; comportamento e implementação não aprovados por este documento.
Data: 05/11/2026.

## Objetivo e vínculo

Permitir que a pessoa autenticada consulte os equipamentos do seu tenant e identifique sua situação. Recorte de leitura do item 2 da primeira versão e da regra de manutenção em `rules/PRD.md`. Aplicam-se ADR-001, ADR-002, `layout.md` e `rules/restrictions.md`.

## Estado observado

`frontend/app/catalogo/page.tsx` lê equipamentos do navegador, filtra localmente e também simula um empréstimo. `frontend/lib/empres-ti-store.ts` oferece dados demonstrativos sem isolamento real no servidor. Isso não comprova os CAs desta spec. A mutação de empréstimo preexistente será inventariada para evitar alterações acidentais; não será considerada implementada ou aprovada por esta spec.

## Regras derivadas das decisões existentes

1. Somente sessão autenticada com membership válida pode consultar dados do tenant autorizado no contexto do servidor.
2. O procedimento de consulta usa tRPC, Zod e service com Prisma. Não acessar banco diretamente pelo navegador.
3. Apresentar situação do equipamento e distinguir disponível, emprestado e manutenção, conforme PRD e layout. Manutenção nunca pode ser tratada como disponibilidade.
4. Seguir tokens, botões contornados e modo escuro do ADR-002.
5. Se houver paginação, seguir cursor, conforme ADR-001. Quantidade por página e ordem ainda dependem de decisão.

## Critérios de aceitação propostos

| ID | Condição, ação e resultado observável |
| --- | --- |
| CA-01 | Dada sessão válida do tenant A e equipamentos em A e B, ao consultar o catálogo, a resposta e a tela não incluem equipamentos de B. |
| CA-02 | Dada ausência de sessão, ao chamar diretamente o procedimento do catálogo, o servidor retorna UNAUTHORIZED sem dados de equipamentos. |
| CA-03 | Dado equipamento disponível ou emprestado retornado pela consulta, ao renderizar o card, a tela apresenta nome, identificação e situação correspondentes, sem converter emprestado em disponível. Identificação final depende de D-02. |
| CA-04 | Dado equipamento em manutenção, ao consultar disponibilidade, ele nunca é retornado como disponível nem apresentado com ação habilitada de solicitar. Sua inclusão na listagem geral depende de D-01. |
| CA-05 | Dado tenant sem equipamentos no resultado da consulta, ao concluir o carregamento, a tela apresenta estado vazio, sem equipamentos demonstrativos de outro usuário ou tenant. |
| CA-06 | Dada falha na consulta do servidor, ao concluir a tentativa, a tela apresenta estado de erro sem apresentar dados demonstrativos como resposta válida. Texto e opção de repetir dependem de D-04. |

## Não decidido e bloqueios

| ID | Tipo | Pergunta | Impacto |
| --- | --- | --- | --- |
| D-01 | Negócio | Manutenção aparece no catálogo geral como indisponível ou fica oculta? | Há divergência no layout: exemplos exibem cards, outras notas dizem que não aparece. Bloqueia listagem geral de manutenção, preservando sua indisponibilidade. |
| D-02 | Negócio | Quais campos são obrigatórios nos cards? Quem pode ver nome do tomador, local e previsão de devolução? | Bloqueia formato final da resposta e CA-03. Evitar exposição de dados pessoais sem definição. |
| D-03 | Negócio/técnica | Qual ordem, tamanho da página e escopo inicial de busca/filtros? | Bloqueia contrato final de listagem. Não copiar silenciosamente a busca local atual como requisito. |
| D-04 | Negócio | Qual texto dos estados vazio/erro e haverá ação de tentar novamente? | Bloqueia estados finais da interface. |

Dependências: sessão e tenant definidos pela spec 001; infraestrutura tRPC/Prisma/testes e fixtures locais. Mudanças de schema dependem da resolução do conflito de migrations. A spec não aprova banco novo ou acesso remoto.

## Contrato afetado

- Tela existente: `/catalogo`.
- Procedimento proposto: `equipment.list`, protegido por `tenantProcedure`, sem tenant no input; filtros e cursor somente após D-03.
- Service proposto: consulta de equipamentos sempre restrita ao tenant do contexto. Retorno tipado por inferência do AppRouter; campos conforme D-02.
- Entidades: equipamentos, tenant e memberships; schema final não é criado por esta documentação.
- Preservar a tela de login e inventariar dependências do store demonstrativo antes de removê-lo. Alterar a ação preexistente de empréstimo exige decisão e tarefa próprias; não a migrar silenciosamente nesta spec de leitura.

## Fora de escopo

Solicitar/devolver equipamento, aplicar limite de três itens, calcular prazo, bloquear empréstimo por atraso, cadastrar equipamentos, painel de Operações, reservas, e-mails e importação. As regras de empréstimo continuam no PRD e devem receber specs próprias antes de implementação.
