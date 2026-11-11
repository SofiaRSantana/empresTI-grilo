# 001 — Login com sessão no servidor

Status: comportamento de acesso aprovado em 10/11/2026. Verificação final da spec pendente.
Data: 05/11/2026.

## Objetivo e vínculo

Permitir que uma pessoa com conta previamente provisionada entre no EmpresTI. Recorte do item 1 da primeira versão em `rules/PRD.md`, limitado ao acesso; a listagem de empréstimos será outra spec. Aplicam-se `docs/adr/001-stack.md`, `docs/adr/002-design-system.md`, `layout.md` e `rules/restrictions.md`.

## Estado anterior

`frontend/app/login/page.tsx` compara credenciais demonstrativas do navegador e grava sessão via `frontend/lib/empres-ti-store.ts`. Isso não comprova Supabase Auth, sessão no servidor ou autorização por tenant. Não há testes nem camada tRPC/Prisma identificados. A tela atual é referência de apresentação, não evidência dos CAs abaixo.

## Regras derivadas das decisões existentes

1. Autenticação por e-mail e senha com Supabase Auth; cadastro fechado. Implementar convite e provisionamento não faz parte deste recorte.
2. Sessão conforme o ADR-001: integração `@supabase/ssr`, cookie `httpOnly` e renovação pelo Proxy do Next nas rotas protegidas. Credenciais e tokens não devem ser persistidos em `localStorage`.
3. Mutações do aplicativo passam por tRPC, com entrada validada em Zod. Não criar Server Action nem API paralela.
4. Autorização é responsabilidade do servidor. Sessão no navegador, rota ou input não podem determinar tenant e papel.
5. Interface de login segue o ADR-002. Credenciais demonstrativas não devem ser oferecidas como acesso real.

## Critérios de aceitação propostos

| ID | Condição, ação e resultado observável |
| --- | --- |
| CA-01 | Dada conta de teste válida e provisionada, ao enviar e-mail e senha corretos, o servidor reconhece a sessão em uma nova requisição autenticada. |
| CA-02 | Dadas credenciais inválidas, ao tentar entrar, nenhuma nova sessão é criada e a tela apresenta erro de autenticação sem revelar a senha. A tela usa a mesma mensagem para credencial inválida ou conta sem vínculo. |
| CA-03 | Dado e-mail inválido ou senha vazia, ao enviar o formulário, a entrada é recusada pela validação e não cria sessão; a tela identifica o campo inválido. |
| CA-04 | Dado acesso sem sessão a procedimento protegido, ao chamá-lo diretamente, o servidor recusa com UNAUTHORIZED e não retorna dados protegidos. |
| CA-05 | Após login válido, a resposta cria cookie de sessão com atributo HttpOnly; credenciais e tokens não aparecem em localStorage. A sessão é reconhecida após recarregar a página. |
| CA-06 | Dado usuário do tenant A, ao tentar selecionar tenant B pelo input ou adulterar o estado do navegador, o contexto do servidor não concede acesso ao tenant B. O servidor resolve apenas o vínculo com o Instituto Germinare. |

## Decisões de acesso

- O servidor seleciona o vínculo com o Instituto Germinare, mesmo quando a identidade tem vínculos com outras organizações. Conta sem esse vínculo não entra no catálogo.
- Após o login, a pessoa vai para `/catalogo`. Credencial inválida, conta não confirmada e ausência de vínculo recebem mensagem genérica. Indisponibilidade recebe mensagem de tentar novamente.
- O Supabase Auth determina a validade dos tokens. O servidor verifica a identidade em cada requisição protegida e renova a sessão por cookie quando o provedor permite. Sessão ausente ou expirada sem renovação retorna ao login.
- A verificação local usa identidades sintéticas com vínculos em organizações diferentes. O provisionamento da conta do professor e da conta de validação pertence à spec 003.

## Contrato afetado

- Tela existente: `/login`; destino após sucesso em `/catalogo`.
- Procedimentos `auth.login`, `auth.session` e `auth.logout`. O login valida e-mail e senha com Zod. O catálogo e a sessão usam a organização resolvida no servidor.
- Contexto: sessão verificada, Prisma, tenant e papel obtidos conforme a política aprovada de memberships.
- Dados envolvidos: identidade Supabase Auth, vínculo de membership e tenant. Não criar tabela paralela de senhas.
- Preservar identidade Nocturne e autorização no servidor; remover dependência de usuários/sessão demonstrativos somente na tarefa aprovada, sem apagar dados de outras funcionalidades.

## Fora de escopo

Cadastro público, convite administrativo, recuperação de senha, SSO, cadastro de inventário e empréstimos. A consulta do catálogo e o provisionamento seguem as specs 002 a 004.
