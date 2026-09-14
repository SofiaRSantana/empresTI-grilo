# ADR-001: Stack

## Decisões

| Item | Escolha |
|---|---|
| Arquitetura | Monolito |
| Aplicação | Next.js (App Router), front e servidor no mesmo projeto |
| Repositório | Único |
| Deploy | Um projeto na Vercel |
| Camada de servidor | Route Handlers do Next, sem servidor separado |
| Linguagem | TypeScript em modo `strict` |
| Renderização | Client Components como padrão para telas com dados |
| Estado de servidor | TanStack Query via `@trpc/react-query` |
| Estado de cliente | `useState` e Context; sem biblioteca de store |
| Formulários | React Hook Form + `zodResolver` |
| Estilização | Tailwind CSS |
| Componentes | shadcn/ui |
| Padrão de API | tRPC |
| Endpoint | Route Handler em `app/api/trpc/[trpc]/route.ts` |
| Organização | `src/server/api/routers/<dominio>.ts`, um router por domínio |
| Camadas | Router (procedimento) → Service → Prisma |
| Validação de entrada | Zod no `.input()` de todo procedimento |
| Serialização | superjson |
| Contexto de request | Sessão, `tenant_id`, `role` e cliente Prisma montados no `createContext` |
| Server Actions | Não usadas |
| Fonte da verdade | O `AppRouter` do tRPC |
| Consumo no cliente | `RouterInputs` e `RouterOutputs` inferidos, sem tipo escrito à mão |
| Versionamento | Nenhum |
| Formato de erro | `TRPCError` com código, tratado por `errorFormatter` |
| Paginação de listas | Cursor, via `useInfiniteQuery` |
| Consumidor externo | Fora de escopo |
| Tempo real | Fora de escopo |
| Banco | PostgreSQL gerenciado pelo Supabase |
| ORM | Prisma |
| Dono do schema | Prisma Migrate (único) |
| RLS, policies e triggers | SQL bruto dentro das migrations do Prisma |
| Instância do Prisma | Singleton global, para sobreviver ao hot reload |
| Conexão de runtime | Supavisor, porta 6543, `?pgbouncer=true&connection_limit=1` |
| Conexão de migration | `directUrl`, porta 5432 |
| Seed | `prisma/seed.ts`, idempotente, cria o tenant `suporte_ti` |
| Modelo | Tenant discriminado por coluna, banco único |
| Coluna | `tenant_id` em toda tabela de domínio |
| Vínculo usuário–tenant | Tabela `memberships (user_id, tenant_id, role)` |
| Primeiro tenant | `suporte_ti`, criado no seed |
| Origem do tenant | Resolvido no `createContext` a partir da sessão, nunca do input |
| Aplicação do filtro | `tenantProcedure` injeta o `tenant_id` no service |
| Provedor de identidade | Supabase Auth, e-mail e senha |
| Cadastro | Fechado, somente por convite de administrador |
| Integração com o Next | `@supabase/ssr` |
| Sessão no navegador | Cookie `httpOnly`, escrito pelo `@supabase/ssr` |
| Renovação de sessão | Middleware do Next em toda rota |
| Autorização | Middlewares do tRPC: `protectedProcedure`, `tenantProcedure`, `adminProcedure` |
| RLS | Habilitado em todas as tabelas, deny by default |
| Papel do RLS | Defesa em profundidade, não autorização primária |
| Runner | Vitest, único para servidor e componentes |
| Componentes | Testing Library |
| Integração de banco | Testcontainers com Postgres real |
| Teste de procedimento | `createCaller` do tRPC, chamando o router direto |
| E2E de interface | Playwright |
| Teste obrigatório de isolamento | Um caso por procedimento: tenant A não enxerga dado de tenant B |
| Meta de cobertura | Sem percentual; caminhos críticos obrigatórios |
| Hospedagem | Vercel, um projeto |
| Plano | Hobby |
| Região das functions | Padrão do Hobby (Estados Unidos) |
| Região do Supabase | `sa-east-1` (São Paulo) |
| Limite de execução | 60s por request |
| Fila e agendamento | Fora de escopo; tudo roda dentro do request |
| Configuração | Variáveis de ambiente validadas com Zod no boot |
| Log | Log estruturado em JSON, com `request_id` e `tenant_id` |
| Rastreamento de erro | Sentry |
| CI | GitHub Actions |
| Migration em deploy | `prisma migrate deploy` em job do GitHub Actions, antes do deploy |
| Cabeçalhos HTTP | Configurados em `next.config.js` |
| CSP | Restritiva, sem `unsafe-inline` |
| Rate limit | Por IP e por usuário, com contador no Postgres |
| Segredos | Environment variables da Vercel; nada com prefixo `NEXT_PUBLIC_` |
| `service_role` key do Supabase | Somente em código de servidor |
| Auditoria | Tabela append-only com ator, tenant, ação e recurso |
| Lint e formatação | ESLint + Prettier |
| Hook de pré-commit | lint-staged + husky, apenas lint e formatação |
| Convenção de commit | Nenhuma automação; mensagem escrita pela pessoa |

## Justificativas

- Arquitetura — não há equipe separada para front e back nem necessidade de escalar as partes de forma independente; separar criaria dois deploys, dois CI e uma fronteira HTTP para manter sem ganho.
- Aplicação — o servidor mora dentro do mesmo projeto do front, então a chamada de dados não atravessa domínio nem exige CORS.
- Repositório — o tipo do procedimento e o tipo consumido na tela são o mesmo símbolo TypeScript; em repositórios separados isso viraria arquivo gerado.
- Deploy — o que é único é o codebase e o deploy, não o runtime.
- Camada de servidor — a lógica fica junto ao app; não há servidor separado para manter.
- Linguagem — sem `strict` o tipo que vem do tRPC não pega os casos de nulo, que são exatamente os que quebram em produção.
- Renderização — misturar Server Components buscando dados direto no Prisma com tRPC buscando pelo cliente cria dois caminhos de acesso a dado, com duas checagens de permissão para manter em sincronia. Um caminho só é mais fácil de auditar.
- Estado de servidor — cache, revalidação e estado de loading já vêm resolvidos e tipados a partir do procedimento; escrever isso por tela é a maior fonte de bug repetido.
- Estado de cliente — depois do TanStack Query sobra pouco estado de cliente, e isso cabe em `useState`.
- Formulários — o mesmo schema Zod que valida a entrada do procedimento valida o formulário, então a regra é escrita uma vez.
- Estilização — o design vem do Figma e precisa ser reproduzido de perto; biblioteca com visual próprio brigaria com isso.
- Componentes — copia o componente para dentro do repositório em vez de esconder atrás de API de biblioteca, então customizar não vira luta contra a dependência.
- Padrão de API — com front e servidor no mesmo TypeScript, o tipo do retorno chega na tela sem geração de código nem contrato escrito à mão.
- Endpoint — ao manter o route handler no local do Next, a API pode ser tratada como parte do app.
- Organização — organizar por domínio mantém a feature inteira junta, sem espalhar arquivos em pastas distantes.
- Camadas — o procedimento cuida de entrada, contexto e permissão; a regra de negócio no service é o que dá para testar sem montar contexto de tRPC.
- Validação de entrada — é o que o tRPC usa para tipar a entrada; sem ele o procedimento aceita `unknown` e a validação vira `if` manual.
- Serialização — sem transformer, `Date` e `Decimal` chegam como string na tela e cada componente refaz a conversão.
- Contexto de request — resolver sessão e tenant no `createContext` evita que cada procedimento repita a leitura do cookie, que é onde alguém esquece e abre buraco.
- Server Actions — seria um segundo caminho de mutação, com outra forma de validar e outra de checar permissão; um caminho só é mais fácil de auditar.
- Fonte da verdade — mudar o retorno de um procedimento quebra o build da tela que o consome, na hora, sem passo de geração.
- Consumo no cliente — declarar interface de resposta à mão recria a duplicação que o tRPC existe para eliminar.
- Versionamento — cliente e servidor sobem no mesmo deploy, então nunca existem duas versões em produção ao mesmo tempo.
- Formato de erro — dá formato único de erro para a tela tratar sem ler string de mensagem.
- Paginação de listas — offset fica lento e duplica registro quando a lista recebe escrita concorrente; e o `useInfiniteQuery` já espera cursor.
- Consumidor externo — se um dia aparecer app mobile ou integração de terceiro, tRPC não serve e será preciso expor REST ao lado.
- Tempo real — function serverless não mantém conexão aberta; atualização de tela é polling do TanStack Query.
- Banco — traz Auth e Storage sem eu operar servidor de banco.
- ORM — tipagem gerada a partir do schema é o que evita divergência entre modelo e código, e alimenta o tipo que o tRPC devolve.
- Dono do schema — Prisma Migrate e Supabase CLI gerenciando o mesmo banco se sobrescrevem; ter dois donos de schema é como o ambiente diverge de produção sem ninguém notar.
- RLS, policies e triggers — o Prisma não modela RLS, policy nem trigger, então esses objetos precisam entrar na mesma linha do tempo versionada, não como script solto aplicado à mão pelo painel do Supabase.
- Instância do Prisma — em desenvolvimento o Next recarrega o módulo a cada alteração e, sem singleton, cada recarga abre um cliente novo até esgotar a conexão.
- Conexão de runtime — obrigatório em serverless, não recomendação: a Vercel escala instâncias em paralelo e cada uma abrindo pool próprio esgota a conexão do projeto.
- Conexão de migration — a migration precisa sair do pgbouncer para não sofrer com o limite de conexão.
- Seed — seed que só funciona em banco vazio não serve para ambiente de teste que roda várias vezes.
- Modelo — schema por tenant multiplicaria cada migration pelo número de tenants; para o escopo do projeto o isolamento lógico basta.
- Coluna — tabela sem a coluna não tem como ser protegida por policy e vira o buraco por onde o dado vaza.
- Vínculo usuário–tenant — a mesma pessoa pode atuar em mais de uma área com papel diferente em cada; papel gravado no usuário não representa isso.
- Primeiro tenant — a estrutura existe desde o primeiro schema mesmo com um único tenant, porque adicionar `tenant_id` depois exige backfill e revisão de toda query que toca a tabela.
- Origem do tenant — se o cliente manda o tenant no input do procedimento, trocar o valor é toda a exploração necessária.
- Aplicação do filtro — depender de cada service lembrar do `where: { tenantId }` é depender de ninguém esquecer nunca.
- Provedor de identidade — não há domínio corporativo para federar, então SSO fica fora de escopo.
- Cadastro — sem domínio de e-mail para filtrar, cadastro aberto deixa qualquer pessoa que descubra a URL criar conta num sistema que guarda inventário de infraestrutura.
- Integração com o Next — como front e servidor estão na mesma origem, o cookie funciona mesmo em `*.vercel.app`, e o token nunca fica legível por JavaScript.
- Sessão no navegador — é a vantagem concreta do monolito nesse projeto.
- Renovação de sessão — sem ele o token expira no meio da navegação e o usuário é deslogado sem motivo aparente.
- Autorização — as regras são "está logado", "pertence ao tenant" e "é administrador"; encadear três middlewares resolve isso sem introduzir uma camada de definição de política para aprender.
- RLS — se uma credencial vazar ou um procedimento esquecer o middleware, a policy é a última barreira entre tenants.
- Papel do RLS — o Prisma conecta com um role dono das tabelas, que bypassa RLS por padrão; fazer as policies valerem exigiria transação com `SET LOCAL role` e `SET LOCAL request.jwt.claims` a cada request.
- Runner — com um projeto só, um runner só cobre servidor e tela, com a mesma config do build.
- Componentes — os testes de componente cobrem a experiência real da tela.
- Integração de banco — mockar o Prisma testa o mock, não o banco.
- Teste de procedimento — testa o procedimento com contexto montado à mão, incluindo middleware de sessão e tenant, sem subir servidor HTTP.
- E2E de interface — os fluxos que travam a operação precisam ser testados no navegador.
- Teste obrigatório de isolamento — vazamento entre tenants é a falha mais cara desse sistema e a mais fácil de introduzir sem perceber; precisa ser verificada por teste, não por revisão.
- Meta de cobertura — meta de cobertura produz teste escrito para subir número; caminho crítico é critério verificável.
- Hospedagem — o Next é o caso nativo da plataforma, então build, preview e roteamento funcionam sem adapter nem configuração extra.
- Plano — o Hobby cobre uso pessoal não-comercial, que é o caso: projeto de disciplina, sem cobrança e sem ninguém sendo pago para escrever o código.
- Região das functions — no Hobby as functions rodam nos EUA e cada query paga ida e volta transatlântica; em contexto de demonstração é aceitável.
- Região do Supabase — o projeto ficou em São Paulo por proximidade com as operações reais do banco.
- Limite de execução — vira o teto de qualquer operação: importação de planilha de ativos e relatório grande precisam ser desenhados em lotes que caibam nesse tempo.
- Fila e agendamento — não há volume assíncrono conhecido; a consequência é que envio de e-mail e integração externa rodam dentro do request e seguram a resposta.
- Configuração — falhar na subida é melhor que `undefined` virando comportamento silencioso em produção.
- Log — investigar incidente em sistema multi-tenant sem poder filtrar por tenant é procurar no escuro.
- Rastreamento de erro — dá disciplina para tratar falhas em produção.
- CI — o deploy depende de pipeline verificando a mudança antes de subir.
- Migration em deploy — em serverless várias instâncias sobem em paralelo e tentariam migrar ao mesmo tempo.
- Cabeçalhos HTTP — cabeçalho de segurança ausente é achado previsível e barato de evitar; no Next não é preciso middleware para isso.
- CSP — o cookie é `httpOnly`, mas um XSS ainda faz request autenticado em nome do usuário; a CSP é o que impede.
- Rate limit — contador em memória não funciona em serverless, porque cada instância tem o seu e o limite nunca é atingido.
- Segredos — esse tipo de variável não pode ir para o bundle do cliente.
- `service_role` key do Supabase — essa chave ignora RLS; num arquivo que o bundle do cliente alcança, ela dá acesso total ao banco para qualquer visitante.
- Auditoria — sistema de TI precisa responder quem mudou o quê; retrofitar log de auditoria depois não recupera o passado.
- Lint e formatação — com repositório único, uma config só vale para tudo.
- Hook de pré-commit — barra o erro trivial antes do CI sem interferir na mensagem de commit.
- Convenção de commit — a mensagem é responsabilidade de quem commita; validação automática de formato seria cerimônia sem changelog gerado para justificar.

## Alternativas descartadas

- Front e API em projetos separados — criaria fronteira HTTP, CORS e dois deploys sem equipe separada para justificar.
- REST com OpenAPI gerado — passo de geração e cliente versionado que o tRPC dispensa dentro de um projeto só.
- GraphQL — custo de schema, resolver e cache não se paga no volume de telas atual.
- Server Actions para mutação — segundo caminho de mutação, com outra validação e outra checagem de permissão.
- Server Components buscando dado direto no Prisma — segundo caminho de leitura, com a checagem de tenant duplicada em outro lugar.
- RLS como autorização primária — o Prisma bypassa RLS por padrão; fazer valer exigiria transação com `SET LOCAL` a cada request.
- Acesso a dado pelo cliente do Supabase em vez do Prisma — deixaria RLS como autorização, mas espalharia o acesso a dado em dois caminhos e tiraria o tipo do Prisma de dentro do tRPC.

## Consequências

### O que fica mais fácil

- manter front e back no mesmo projeto e no mesmo deploy;
- seguir o mesmo tipo TypeScript do procedimento até a tela;
- validar entrada, tenant e permissão em um único caminho;
- operar sem uma camada extra de API externa para o projeto atual;
- testar o comportamento olhando o banco real e o router em vez de duas camadas separadas.

### O que fica mais difícil

- escalar por partes separadas;
- separar o front do back sem reescrever o fluxo de dados;
- manter integrações externas e processamento assíncrono sem sair do limite de request;
- operar em regiões mais próximas do usuário ou em infra que não siga o Hobby da Vercel.

### O que isso nos impede de fazer depois sem custo

- trocar para microserviços ou repositórios separados sem replanejar o projeto;
- expor uma API pública estável para consumidores externos sem criar uma camada paralela;
- usar tempo real de verdade em larga escala sem mudar a modelagem de comunicação;
- rodar filas, agendamentos e jobs pesados no mesmo desenho sem refatorar a operação.

## O que este ADR NÃO decide

- não decide o desenho de microserviços, divisão de times ou múltiplos repositórios depois;
- não decide API pública, app mobile, integrações externas ou tempo real para usuários fora do escopo atual;
- não decide a migração de plano, região de deploy ou a mudança de infraestrutura quando o uso sair do contexto do projeto atual;
- não decide o escopo do produto, a prioridade de cada funcionalidade ou a criação de novos processos fora do que está no stack base.
