---
name: imagens-equipamentos
description: Pesquisar fotos de equipamentos do EmpresTI pela API do Pixabay, revisar a seleção e preparar arquivos de 800 × 600 com Sharp e manifesto de créditos para o catálogo.
---

# Fotos do catálogo EmpresTI

Use a lista de patrimônios da [spec de dados iniciais](../../docs/specs/003-dados-iniciais.spec.md). Preserve fotos existentes fora do catálogo de equipamentos.

1. Siga a [referência de busca e revisão](references/pixabay.md). Busque candidatos para um patrimônio por vez com o script da skill.
2. Registre o ID aprovado para cada patrimônio e os motivos das rejeições. Descarte fotos com pessoas, marcas, logos, texto legível ou telas com conteúdo.
3. Prepare o lote com o script. Confira as fotos já processadas e o manifesto antes de entregar o lote para publicação.

A skill prepara arquivos locais. A responsável pelo projeto executa o upload para o Supabase Storage. O catálogo exibe o crédito ao Pixabay e usa as cópias hospedadas no Storage.
