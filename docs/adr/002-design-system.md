# ADR-002: Design System Nocturne EmpresTI

- Status: Aceito
- Data: 2026-10-02

## Contexto

O produto EmpresTI é um sistema interno de empréstimo de equipamentos, com operação em modo escuro e forte foco em leitura rápida, organização de inventário e tarefas de operação. A identidade visual precisa ser consistente em todas as telas: login, catálogo, detalhe do item, operações e cadastro.

A especificação de layout em `layout.md` define a base visual e a linguagem da interface. Como o projeto usa um único app e um único deploy, o design system precisa ser reproduzível em código e facilmente mantido, sem alternância de tema e sem ruído visual.

## Decisão

Vamos adotar um design system próprio, baseado no estilo visual definido como `Nocturne` e adaptado à identidade da EmpresTI. A base será um tema dark-only, com tokens semânticos, espaçamentos densos e componentes de UI consistentes.

### 1. Diretrizes visuais

1. Modo escuro exclusivo, sem alternância de tema.
2. Fundo quase preto azulado, com superfícies elevadas por borda e escurecimento, não por sombras pesadas.
3. Ações primárias em borda contornada, com fundo transparente, nunca preenchidas com cor sólida.
4. A primária `#001449` é usada como fundo profundo e apoio de destaque; não como texto principal nem botão.
5. A cor de ação visível é `#5B7FE0`.
6. Uso de azul e cinzas em baixa saturação, com foco na leitura e no contraste funcional.
7. Layouts densos, alinhados à esquerda e com títulos flush-left.
8. Sem gradientes agressivos, sem preto/branco puros e sem emoji como linguagem visual.

### 2. Tokens de cor

#### 2.1 Base

| Token | Valor | Uso |
|---|---|---|
| `--page` | `#05070F` | Fundo fora do app |
| `--color-bg` | `#080C1A` | Fundo da aplicação |
| `--sidebar-bg` | `#060A16` | Sidebar |
| `--color-surface` | `#0E1530` | Cards e painéis |
| `--surface-sunken` | `#0B1128` | Inputs, headers, blocos internos |
| `--color-text` | `#E6EAF6` | Texto principal |
| `--text-muted` | `#8A93B2` | Texto secundário |
| `--text-dim` | `#7C86A2` | Metadados |
| `--text-faint` | `#5E6884` | Rótulos e apoio |
| `--text-ghost` | `#454E68` | Rótulos de grupo |

#### 2.2 Bordas e divisores

| Token | Valor | Uso |
|---|---|---|
| `--border-frame` | `#222C4A` | Moldura e inputs inativos |
| `--border-card` | `#1F2949` | Borda de cards |
| `--border-soft` | `#1A2340` | Divisores da sidebar e header |
| `--border-row` | `#161D33` | Linhas internas |
| `--border-strong` | `#2B3450` | Inputs e botões secundários |

#### 2.3 Primária e ação

| Token | Valor | Uso |
|---|---|---|
| `--accent-100` | `#EEF2FE` | Hover de botão primário |
| `--accent-200` | `#D6E0FB` | Texto de confirmação e chip ativo |
| `--accent-300` | `#B4C6F6` | Texto de botão primário |
| `--accent-400` | `#8AA6EE` | Ícones e links |
| `--accent-500` | `#5B7FE0` | Cor de ação principal |
| `--accent-600` | `#3C5DBE` | Hover de card e borda ativa |
| `--accent-700` | `#25408F` | Borda ativa e logo |
| `--accent-800` | `#132663` | Fundo de chip ativo |
| `--accent-900` | `#001449` | Primária profunda |

#### 2.4 Estados semânticos

| Estado | Texto | Fundo | Borda |
|---|---|---|---|
| Disponível | `#5FD3AA` | `rgba(63,185,140,0.12)` | `rgba(63,185,140,0.35)` |
| Emprestado | `#9AA3BC` | `#1A2340` | `#2B3450` |
| Manutenção | `#E8B961` | `rgba(224,163,63,0.12)` | `rgba(224,163,63,0.35)` |
| Atraso | `#F0A0A5` | `rgba(224,91,98,0.05)` | `rgba(224,91,98,0.4)` |

### 3. Tipografia

- Família: `Open Sans`, fallback `system-ui, sans-serif`.
- Pesos usados: `400` para corpo e `600` para títulos, rótulos e valores.
- Títulos com `letter-spacing: -0.01em`.
- Nomes de marca com `letter-spacing: 0.02em`.
- Rótulos uppercase com `letter-spacing: 0.08em` a `0.12em`.

Escala recomendada:

- Título de página: `24px` / `600`
- Hero login: `34px` / `600`
- Nome de item em card: `14.5px` / `600`
- Corpo e inputs: `13–14px` / `400`
- Metadados: `12px` / `400`
- Badge/pill: `11px` / `600`

### 4. Espaçamento, raios e sombras

#### 4.1 Espaçamento

Escala aplicada: `3, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 26, 28, 32, 40, 56, 64`px.

Sempre utilizar `display:flex` / `grid` + `gap`, em vez de margens independentes.

#### 4.2 Raios

| Raio | Uso |
|---|---|
| `14px` | Moldura de tela | 
| `12px` | Cards e painéis |
| `10px` | Blocos da sidebar |
| `9px` | Ícones em cards |
| `8px` | Inputs, botões e itens de navegação |
| `99px` | Pills e badges |

#### 4.3 Sombras

- Frame principal: `0 0 0 1px #222C4A, 0 18px 44px rgba(0,0,0,0.6)`
- Card/dialog: `0 0 0 1px #454E68, 0 18px 44px rgba(0,0,0,0.7)`
- Sem empilhamento de sombras; a elevação é por borda + escurecimento, não por brilho exagerado.

### 5. Layout estrutural

#### 5.1 App shell

- Sidebar: `236px` fixa
- Main: flexível
- Header: altura `64px`, borda inferior `#1A2340`
- Conteúdo: padding `28px`, `gap: 20–22px`

#### 5.2 Grids da aplicação

- Catálogo: `repeat(3, minmax(0, 1fr))`, `gap: 16px`
- Operações: `repeat(4, minmax(0, 1fr))`, `gap: 14px`
- Detalhe de item: `1fr 356px`, `gap: 32px`
- Formulário de cadastro: `1fr 320px`, `gap: 40px`

### 6. Componentes

#### 6.1 Botões

- Primário: borda `#5B7FE0`, fundo transparente, texto `#B4C6F6`, hover com `background: rgba(91,127,224,0.12)`
- Secundário: borda `#2B3450`, texto `#9AA3BC`
- Confirmação de diálogo: borda `#5B7FE0`, fundo `rgba(91,127,224,0.12)`
- Foco de teclado: `outline: 2px solid #5B7FE0; outline-offset: 2px`
- Desabilitado: `opacity: 0.45`

#### 6.2 Pill de estado

Uso em cartões, linhas e blocos resumidos: `font-size: 11px`, `font-weight: 600`, `padding: 3px 9px`, `border-radius: 99px`.

#### 6.3 Chips de filtro

- Ativo: fundo `#132663`, borda `#25408F`, texto `#D6E0FB`
- Inativo: fundo transparente, borda `#222C4A`, texto `#9AA3BC`

#### 6.4 Card de equipamento

- Ícone 40×40 com fundo `#0B1128`
- Estado em pill no topo direito
- Nome do item em `14.5px`, `600`
- Metadado em `12px`, `#7C86A2`
- Rodapé com indicação de ação e informação de devolução
- Hover: borda azul de ação

#### 6.5 Inputs

- Fundo `#0B1128`
- Borda `#2B3450`
- Texto `#E6EAF6`
- Placeholder em `#5E6884`
- Foco: borda `#5B7FE0`

### 7. Divisores e assinatura visual do sistema

As linhas horizontais seguem o padrão Nocturne com gradação nas pontas:

```css
background: linear-gradient(
  to right,
  rgba(230,234,246,0),
  #222C4A 48px,
  #222C4A calc(100% - 48px),
  rgba(230,234,246,0)
);
```

Divisores curtos internos continuam sólidos. Isso dá à interface a assinatura visual do sistema e evita bordas rígidas no centro da tela.

### 8. Componentes fora do escopo do layout atual

Para manter a consistência do sistema, a construção dos componentes deve seguir a mesma linguagem visual mesmo quando a funcionalidade real ainda não exista. Isso inclui:

- telas de listagem
- tabelas
- formulários
- cards de resumo
- indicadores de status
- estados vazios e de erro
- ações de linha e confirmação

### 9. Implementação recomendada no código

O design system deve ser implementado por meio de tokens CSS e classes utilitárias do Tailwind, com os seguintes princípios:

- centralizar paleta e tokens em `globals.css`
- usar classes consistentes para background, border, text e state
- manter a equivalência entre tokens e componentes visuais
- evitar customização ad hoc em cada página
- manter todo estado visual (ativo/inativo/erro/disponível) semântico e reusável

## Justificativa

- O layout de EmpresTI é denso, funcional e orientado a operação; o sistema visual precisa apoiar leitura rápida e gestão de inventário.
- O design precisa ser consistente em todas as telas, sem variação de tema.
- A regra de botão contornado, em vez de preenchido, melhora legibilidade em telas profundas e reduz poluição visual.
- O uso de azul profundo como primária não anula a necessidade de ação com azul mais claro; essa separação produz contraste sem quebrar a identidade do produto.
- O sistema foi desenhado para uso em ambiente interno, priorizando clareza operacional sobre visual exuberante.

## Consequências

### Benefícios

- interface uniforme em todas as telas do sistema;
- leitura mais confortável em ambiente de operação;
- menor risco de inconsistência visual ao criar novas páginas;
- suporte fácil para expansão de componentes sem desmontar a linguagem atual.

### Custos

- qualquer mudança visual precisa passar pela regra do sistema para não quebrar consistência;
- o tema escuro limita a criação de elementos muito coloridos ou de alto contraste;
- a densidade do layout exige disciplina no uso de spacing e feedback visual.

## Alternativas descartadas

- design system claro com fundo claro e azul mais saturado
- tema genérico de SaaS sem identidade própria
- uso de gradientes fortes e botões preenchidos como padrão primário
- sistema com tokens não semânticos e cor por página

## Relação com a especificação de layout

Este ADR toma como fonte de verdade o documento `layout.md`, que define a identidade visual do produto. Qualquer nova tela ou componente deve respeitar os valores e escalas ali definidos, e qualquer desvio deve ser tratado como ajuste intencional do design system, não como exceção esporádica.
