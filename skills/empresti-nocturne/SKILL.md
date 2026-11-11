---
name: empresti-nocturne
description: Aplicar ou revisar o design system Nocturne em telas e componentes do EmpresTI, com base no ADR-002 e no layout do projeto. Use para implementar interface autorizada ou conferir fidelidade visual. Não define regras de negócio, permissões ou novos estados de equipamento.
---

# Aplicar Nocturne no EmpresTI

Traduza a referência visual em componentes consistentes, preservando os contratos da funcionalidade. Esta skill não contém outra cópia da paleta ou das medidas: consulte as fontes mantidas pelo projeto.

## Fontes e seleção do contexto

Os links partem desta pasta; caminhos de código e specs são relativos à raiz do EmpresTI.

- Leia [AGENTS](../../AGENTS.md), [restrições](../../rules/restrictions.md), [ADR-002](../../docs/adr/002-design-system.md) e `frontend/AGENTS.md`.
- Em [layout](../../layout.md), consulte cores/tipografia, componentes e a seção da tela afetada. A referência contém seis telas; não é necessário implementar as outras para concluir uma delas.
- Leia a spec `docs/specs/NNN-nome.spec.md`, plano e tarefa envolvidos antes de mudar comportamento. Em revisão visual isolada, aponte divergências sem afirmar cumprimento funcional.
- Antes de escrever código Next, consulte os guias locais indicados pelo AGENTS do frontend. Não presuma compatibilidade de APIs pela memória.

## Passar da referência para a tela

1. Identifique o estado a reproduzir e os componentes existentes: login, shell, card, filtro, tabela, formulário ou diálogo. Reutilize o padrão mantido quando houver; não crie outro sistema de tokens.
2. Mapeie fundo, superfície, borda, texto, ação e estado semântico aos tokens do ADR-002 e às classes existentes em `frontend/app/globals.css`. Preserve o tema exclusivamente escuro, botões primários contornados e a distinção entre azul profundo da marca e cor de ação.
3. Confira a composição específica no layout: larguras, densidade, tipografia Open Sans, proporção de colunas e uso de gap. Não copie cores/medidas do catálogo para um diálogo com outra especificação.
4. Garanta que estados de carregamento, vazio, erro e indisponibilidade correspondam à spec. Não use equipamento demonstrativo como fallback de consulta que falhou.
5. Verifique foco visível, nomes acessíveis, associação de labels, navegação por teclado e identificação de status além da cor. Nos diálogos, confira foco inicial, contenção e retorno do foco. Respeite movimento reduzido.
6. Adapte o layout ao espaço disponível sem esconder ações essenciais ou introduzir rolagem horizontal acidental. As molduras desktop do documento são referências; requisitos novos para mobile devem ser explicitados, sem inventar uma navegação paralela.

## Conflitos já conhecidos

- As notas finais de `layout.md` pedem estilos inline, mas os ADRs prescrevem Tailwind e tokens centralizados. Registre o conflito antes de alterar a estratégia de estilos; não reescreva ADR ou a decisão do time por conta própria. A revisão pode apontar as duas fontes sem modificar código.
- Manutenção aparece em exemplos de cards e é ocultada em outras notas do layout. Consulte D-01 de `docs/specs/002-catalogo-leitura.spec.md`; não escolha visibilidade pela aparência da referência. Manutenção nunca equivale a disponibilidade.
- O layout mostra nomes de tomadores, prazo e exemplos estáticos. A permissão para exibir esses dados depende da spec; um exemplo visual não concede acesso a dados pessoais.
- Elemento desenhado não prova que backend ou funcionalidade existem. Preserve essa distinção ao avaliar botões e contadores do protótipo.

Interrompa somente a mudança dependente do conflito, conforme as restrições. Continue a inspeção visual independente que estiver no escopo.

## Verificação e entrega

Se houver ambiente local já preparado, confira a tela renderizada nos estados afetados, incluindo teclado e largura disponível. Compare com as seções pertinentes do layout. Se não conseguir renderizar, informe que a conferência visual não foi executada; não substitua essa evidência por leitura de CSS.

Use [checks](../../rules/checks.md) e [testes](../../rules/tests.md) quando houver mudança de código. Evite snapshots extensos que só congelem o HTML; teste interações e resultados dos CAs aplicáveis.

Relate tela/estado, referência usada, divergências, alterações autorizadas e verificações reais. Não apresente revisão visual como autenticação, autorização, persistência ou prova final da spec. Não instale bibliotecas, fontes ou assets novos como efeito colateral desta skill.
