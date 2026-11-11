---
name: empresti-revisar-codigo
description: Revisar código ou plano técnico do EmpresTI com critérios SOLID aplicados ao monólito Next.js, tRPC e Prisma. Use para revisar um diff, uma implementação ou responsabilidades entre camadas. Não substitui a verificação de critérios de aceitação pelo verificador-spec.
---

# Revisar código do EmpresTI

Produza achados concretos e proporcionais ao escopo. SOLID orienta a análise; não exige classes, interfaces, injeção de dependência ou novas camadas sem benefício demonstrável.

## Contexto e entrada

Resolva os links abaixo a partir desta pasta; os demais caminhos citados são relativos à raiz do EmpresTI.

Leia [AGENTS](../../AGENTS.md), [restrições](../../rules/restrictions.md), [ADR-001](../../docs/adr/001-stack.md) e os AGENTS dos diretórios abrangidos. Receba o escopo: arquivos, diff local disponível ou plano. Para revisão funcional, leia a spec correspondente em `docs/specs/NNN-nome.spec.md` e seus arquivos `.plan.md` e `.tasks.md`.

Se não houver escopo identificável, peça apenas o dado necessário. Uma revisão arquitetural delimitada pode prosseguir sem spec; registre que não confirma comportamento. Não invente requisito para converter preferência em defeito.

## Leitura orientada por risco

Percorra o fluxo afetado: evento da tela → procedimento tRPC → service → Prisma. Leia os chamadores e contratos necessários para confirmar cada problema, sem expandir para uma auditoria de todo o projeto.

| Lente | O que procurar neste projeto | Evidência útil |
| --- | --- | --- |
| Responsabilidade única | Regra de negócio espalhada entre tela, procedure e service; sessão/validação duplicadas | Dois caminhos alteram o mesmo estado com regras divergentes |
| Aberto/fechado | Uma variação concreta exige editar vários pontos ou amplia condicionais frágeis | Mostrar a mudança já pedida e os pontos que podem divergir; não extrair abstração para futuro hipotético |
| Substituição | Implementações, adapters ou mocks violam o contrato consumido | Um caso real de null, erro, autorização ou efeito colateral que o chamador trata incorretamente |
| Segregação de interfaces | Resposta ou componente expõe dependências e dados desnecessários | Um consumidor recebe campos sensíveis ou exige informações sem relação com sua tarefa |
| Inversão de dependência | Regra de negócio depende de detalhe de UI, relógio ou persistência que impede testar o comportamento relevante | Limite de empréstimo depende da hora do navegador ou de estado alterável pelo cliente |

Não transforme a inversão de dependência em exigência de repositório genérico. Respeite o fluxo service → Prisma decidido no ADR. Uma função simples e um contrato pequeno podem bastar.

## Pontos específicos do EmpresTI

- Confira se sessão, papel e tenant são obtidos no servidor; rastreie filtros de tenant nas operações afetadas. Não considere rota ou localStorage como autorização.
- Verifique fronteira cliente/servidor e imports que poderiam levar credenciais ou acesso a dados ao navegador, sem imprimir segredos.
- Em mutações de empréstimo, quando fizerem parte da spec revisada, examine concorrência: duas solicitações podem passar pelo mesmo limite ou disponibilidade antes de gravar? Demonstre o cenário e a garantia ausente, sem criar regra nova.
- Confirme Zod na entrada e tipos inferidos do AppRouter; examine cópias manuais de contratos que já divergiram.
- Consulte [testes](../../rules/tests.md) e [checks](../../rules/checks.md) para avaliar evidências. Falta de teste não autoriza alegar falha funcional; descreva separadamente a lacuna e o defeito comprovado.
- Em interface, consulte ADR-002 e layout apenas quando o achado exigir essa referência.

## Entrega e limites

Para cada achado, informe arquivo e linha, condição que dispara o problema, efeito observável, regra/contrato relacionado e menor correção viável. Ordene pelo impacto. Diferencie defeito, conflito documental e sugestão opcional; omita sugestões sem ganho concreto.

Se não houver achado comprovado, diga que não encontrou problemas no escopo e registre o que não foi verificado. Não afirme aprovação integral da spec.

Revisão, por si, não inclui correção. Corrija somente quando a solicitação e a tarefa autorizarem. Não rode migration, preparação de banco, Git remoto ou publicação como parte da revisão. O subagente verificador permanece responsável pela prova CA a CA, em contexto limpo.
