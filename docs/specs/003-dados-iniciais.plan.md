# Plano técnico — 003 Dados iniciais

Status: proposto para revisão.

## Dependências e ordem

O monólito permanece em `frontend/`. A [spec 001](001-login.spec.md) fornece Supabase Auth, sessão e contexto de organização. A [spec 002](002-catalogo-leitura.spec.md) consome o inventário. Seguir o [ADR-001](../adr/001-stack.md) e os [checks do projeto](../../rules/checks.md).

1. Confirmar o identificador da organização do catálogo e o significado de `accessory` nos dados existentes. Proposta: modelar Cabo como categoria própria e preservar os demais acessórios. Levar essa proposta e o DDL para revisão antes de alterar o schema.
2. Levantar o histórico do SQL local e identificar, com evidência fornecida pela responsável, o que já foi aplicado em produção. Propor a linha de base do Prisma Migrate para banco existente e banco vazio, preservando dados, restrições e RLS. Alinhar [a regra de migrations](../../rules/migration.md) ao ADR-001 antes de gerar a primeira migration. Validar a proposta em banco descartável.
3. Preparar a skill e o lote local de fotos. Essa etapa pode avançar em paralelo com a definição do schema.
4. Implementar a carga após a aprovação do schema e a conclusão da base de autenticação e testes.

## Implementação proposta

- **Fotos.** Em `skills/imagens-equipamentos/`, documentar busca pela API do Pixabay, cache das consultas por 24 horas e revisão visual. O script usa Sharp para gerar arquivos de 800 × 600 e valida dimensão, proveniência e duplicidade antes de montar o manifesto. Usar preenchimento de bordas quando o recorte eliminar parte do equipamento. Usar a chave somente no processo local, sem registrar URLs de consulta que a contenham. Guardar o resultado localmente para revisão e upload.
- **Inventário.** Em scripts de operação do monólito, separar a entrada dos 12 itens do código de carga. Usar a chave composta de organização e patrimônio. Criar os registros ausentes e manter a situação operacional dos existentes. Usar caminhos determinísticos no Storage e verificar os objetos antes de gravar as referências no banco.
- **Contas.** Usar a administração do Supabase Auth somente no fluxo de provisionamento autorizado. Localizar ou criar a identidade e garantir o vínculo de colaborador na organização alvo. Em caso de falha entre Auth e PostgreSQL, a reexecução retoma pelo usuário existente. As senhas entram por configuração protegida. Para as provas automatizadas, substituir identidades reais por contas sintéticas.
- **Produção.** Validar em ambiente local as mesmas etapas, inclusive o acesso público aos objetos em Storage local. Na publicação, a responsável executa o upload e as escritas no banco de produção, conforme a prática. Preparar instruções que permitam conferir o alvo e os resultados de cada etapa.

## Verificação

Validar a preparação das fotos, a carga repetida após mudança de situação de um item, o vínculo de colaborador e o login com zero empréstimos. Usar os runners definidos na tarefa de infraestrutura e identificar os testes com os CAs da spec. O verificador recebe apenas a spec e o escopo implementado. A conferência em produção fica registrada como evidência da entrega.
