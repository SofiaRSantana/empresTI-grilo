# 003 — Dados iniciais

Status: comportamento aprovado em 10/11/2026.

## Objetivo e vínculo

Preparar o inventário inicial e a conta de avaliação, conforme o [PRD](../../rules/PRD.md), o [ADR-001](../adr/001-stack.md) e o briefing da prática. O login real depende da [spec 001](001-login.spec.md). A leitura do catálogo é tratada na [spec 002](002-catalogo-leitura.spec.md).

## Regras

1. Carregar os seguintes itens na organização do catálogo. A situação do cabo TI-0010 segue o briefing de dados iniciais.

   | Patrimônio | Nome | Categoria | Situação inicial |
   | --- | --- | --- | --- |
   | TI-0001 | Notebook 14 polegadas | Notebook | Disponível |
   | TI-0002 | Notebook 15 polegadas | Notebook | Disponível |
   | TI-0003 | Notebook 13 polegadas | Notebook | Disponível |
   | TI-0004 | Notebook 15 polegadas | Notebook | Manutenção |
   | TI-0005 | Monitor 24 polegadas | Monitor | Disponível |
   | TI-0006 | Monitor 27 polegadas | Monitor | Disponível |
   | TI-0007 | Monitor 22 polegadas | Monitor | Manutenção |
   | TI-0008 | Cabo HDMI 2 m | Cabo | Disponível |
   | TI-0009 | Cabo USB-C 1 m | Cabo | Disponível |
   | TI-0010 | Cabo de rede 3 m | Cabo | Disponível |
   | TI-0011 | Webcam Full HD | Câmera | Disponível |
   | TI-0012 | Câmera compacta | Câmera | Disponível |

2. Todos os itens têm localização **Balcão de Suporte TI**. O patrimônio identifica um único equipamento dentro da organização.
3. Cada item recebe uma foto exclusiva, obtida via API do Pixabay, processada com Sharp para 800 × 600 pixels e revisada antes da publicação. Descartar fotos com pessoas, marcas, logos, texto legível ou telas com conteúdo. Registrar patrimônio, ID da foto, autor, URL de origem e licença no manifesto. As cópias aprovadas ficam no Supabase Storage e abrem por URL pública.
   - As fotos escolhidas para TI-0001, TI-0004, TI-0009 e TI-0011 preenchem os 800 × 600 pixels com ampliação proporcional e recorte.
   - Exceções específicas para as fotos escolhidas: o porta-retrato no fundo de TI-0001 (Pixabay 5517762), o conteúdo da tela e a marca visível de TI-0004 (Pixabay 459196), a marca no conector de TI-0009 (Pixabay 1281037), a inscrição “720p” na foto ilustrativa de TI-0011 (Pixabay 5095868) e as legendas dos botões de TI-0012 (Pixabay 551287). O equipamento TI-0011 continua identificado como **Webcam Full HD**.
4. A conta indicada para o professor entra como colaborador na organização do catálogo e começa com zero empréstimos. A conta de Sofia indicada no chat será usada para a validação da entrega. Testes automatizados usam identidades sintéticas. As credenciais padrão são fornecidas por configuração protegida.
5. A carga cria zero empréstimos. Repetir a carga não duplica registros, contas, vínculos ou arquivos, nem restaura a situação inicial de um equipamento cuja situação tenha mudado em operação.

## Critérios de aceitação

| ID | Condição, ação e resultado observável |
| --- | --- |
| CA-01 | Dada uma organização sem inventário, ao executar a carga, os 12 patrimônios têm os nomes, categorias e situações da tabela, todos com localização Balcão de Suporte TI. |
| CA-02 | Dadas as fotos aprovadas, ao conferir os 12 arquivos e seu manifesto, cada patrimônio tem um ID Pixabay distinto, autor, origem e licença, e sua imagem pública abre sem login com exatamente 800 × 600 pixels. |
| CA-03 | Dada a conta provisionada do professor, ao entrar com as credenciais fornecidas, ela tem acesso de colaborador à organização do catálogo e nenhum empréstimo. |
| CA-04 | Dada uma primeira carga concluída e um item cuja situação mudou, ao repetir a carga, os identificadores dos itens, contas e vínculos e os caminhos dos arquivos se mantêm, a situação alterada é preservada e nenhum empréstimo é criado pela carga. |
| CA-05 | Dadas uma foto repetida, uma imagem com dimensão inválida ou uma entrada sem proveniência, ao validar o lote, o item é rejeitado antes da preparação para publicação. |

## Fora de escopo e decisões pendentes

Cadastro de equipamento pela interface, empréstimos e importação de planilha ficam fora desta spec. O catálogo usa a organização Instituto Germinare aprovada na spec 001 e Cabo como categoria própria. O histórico local usa Prisma Migrate. O [registro da entrega](../../ENTREGA.md) documenta a divergência do caminho do seed e do primeiro tenant com o ADR-001. A revisão visual tem evidência própria de aprovação e rejeição de fotos.

## Contrato afetado

Equipamentos, Supabase Auth, vínculos de organização, Supabase Storage e o manifesto produzido pela skill. A entrega publicada será validada após aprovação da etapa de produção.
