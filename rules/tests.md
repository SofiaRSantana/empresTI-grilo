---
description: Convenções e evidências para testes do EmpresTI. Leia antes de escrever ou alterar testes.
globs: ["frontend/**/*.test.*", "frontend/**/*.spec.*"]
alwaysApply: false
---

# Testes — EmpresTI

## Autoridade e estado atual

Siga o ADR-001, a spec revisada e `rules/restrictions.md`. Esta regra define como testar; os comandos e as condições de encerramento pertencem a `rules/checks.md`.

Os runners disponíveis e os requisitos de ambiente estão em [checks.md](checks.md). A integração atual usa o PostgreSQL da instância Supabase descartável, já preparado pelo agente principal. A preparação do ambiente é separada da execução dos testes.

## Evidência por critério de aceitação

- Cada teste de aceitação deve citar o ID oficial do critério no nome, por exemplo `001-login CA-02: credencial inválida não cria sessão`.
- Identifique também a spec de origem no arquivo de teste para distinguir CAs com IDs iguais.
- Derive as asserções da condição, ação e resultado da spec. O ID no nome, sozinho, não comprova atendimento.
- Cubra o caminho esperado, negativas e limites pertinentes. Critério ambíguo deve voltar ao time, sem inventar comportamento.
- Um mock de autenticação ou de dados pode apoiar teste de componente, mas não comprova sessão real, persistência ou isolamento no servidor.
- Teste ignorado, comentado, inexistente ou não executado não conta como aprovado. Lint e build não substituem teste de CA.

## Ferramentas e camadas

Use somente a stack do ADR-001: Vitest; Testing Library para componentes; `createCaller` do tRPC para procedimentos; Testcontainers com PostgreSQL real para integração; Playwright para fluxos-chave.

Teste services pelas regras de negócio; procedimentos pela validação Zod, sessão, autorização e contexto; componentes por interações e resultados acessíveis; fluxos-chave pela experiência no navegador. Não aprove acesso real ao banco com Prisma mockado.

Para cada procedimento que acessa dados, inclua ao menos um caso demonstrando que o tenant A não acessa dados do tenant B. Cubra leitura e mutação conforme o procedimento, ausência de sessão e ausência de associação ao tenant. O tenant deve vir do contexto, nunca do input do cliente. Nos casos de recusa, verifique também que o dado não foi alterado.

## Ambiente e dados

- Use dados sintéticos e ambiente local descartável, isolado de dados reais. Não use credenciais ou projetos Supabase remotos.
- Antes de executar, confirme o destino efetivo das conexões, incluindo variáveis herdadas, configuração de testes, scripts e hooks. Não imprima segredos.
- Se o destino for remoto, desconhecido ou depender de preparação não autorizada, não execute; registre o impedimento.
- Testes com escrita só podem usar o banco local descartável já preparado para a tarefa. Não configure reset, seed ou migration implícitos em scripts de verificação.
- O verificador não cria banco nem executa migration, seed ou reset. Preparação pelo principal depende das restrições e da resolução do conflito de migrations registrado em `rules/spec-flow.md`.
- Isole os dados de cada teste e limpe apenas os registros sintéticos do próprio teste no banco confirmado. Não use limpezas globais ou dados compartilhados de desenvolvimento.
- Controle relógio e datas nos testes de prazo. Fuso e instante de vencimento dependem da spec aprovada, não do relógio do navegador.

## Registro e revisão

Registre spec, CAs cobertos, arquivos de teste e código, comando, diretório, resultado e impedimentos, sem valores de segredos. A verificação final segue `agents/verificador-spec.md`, em contexto limpo. Quem corrige é o principal.
