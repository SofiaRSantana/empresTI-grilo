# Busca e revisão de fotos

Use a [documentação da API](https://pixabay.com/api/docs/) e o [resumo da licença](https://pixabay.com/service/license-summary/). A API pede cache de 24 horas para consultas, restringe downloads em massa e veda usar as URLs retornadas como hospedagem permanente das imagens. Guarde a chave em `PIXABAY_API_KEY`, em configuração local protegida. O script usa essa chave somente nas consultas à API.

Com as dependências de `frontend/` disponíveis, execute a partir da raiz do repositório. Escolha uma pasta local de trabalho fora dos arquivos versionados.

```text
node --env-file=frontend/.env.local skills/imagens-equipamentos/scripts/fotos.mjs buscar <pasta-de-trabalho> "laptop on white desk"
node --env-file=frontend/.env.local skills/imagens-equipamentos/scripts/fotos.mjs preparar <pasta-de-trabalho> <selecao.json>
```

Abra a página original de cada candidata para verificar se o equipamento é reconhecível e se a imagem está livre de pessoas, marcas, logos, texto legível e conteúdo de tela. Registre os IDs e os motivos das rejeições para o relatório da prática. Confirme a licença da foto na origem.

O arquivo de seleção é um objeto JSON que associa cada patrimônio ao ID numérico aprovado no Pixabay. Exemplo de uma entrada: `{"TI-0001": 123456}`. O lote deve conter `TI-0001` a `TI-0012`.

| Patrimônio | Busca inicial do briefing |
| --- | --- |
| TI-0001 | laptop on white desk |
| TI-0002 | open laptop minimal desk |
| TI-0003 | laptop closeup keyboard |
| TI-0004 | closed laptop on table |
| TI-0005 | computer monitor on desk |
| TI-0006 | monitor screen office desk |
| TI-0007 | black computer screen |
| TI-0008 | hdmi cable |
| TI-0009 | usb cable white background |
| TI-0010 | ethernet cable |
| TI-0011 | webcam |
| TI-0012 | compact camera on table |

A pasta `lote/` recebe as fotos JPEG e o manifesto. Cada entrada inclui patrimônio, ID da foto, autor, página de origem, licença, nome do arquivo e SHA-256. Compare o resultado final com a seleção antes de disponibilizar o lote para upload. O nome do arquivo é estável por patrimônio.
