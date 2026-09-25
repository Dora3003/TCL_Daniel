# Persistência de Dados — Specification

## Problem Statement

O sistema de estacionamento precisa guardar registros de entrada e saída de veículos de forma confiável. Sem persistência, a guarita perde o histórico ao reiniciar a aplicação e não consegue calcular tempo e valor cobrado na saída.

## Goals

- [ ] Subir PostgreSQL localmente via `docker compose up` sem configuração manual
- [ ] Modelar e migrar o schema de registros de estacionamento
- [ ] Garantir integridade: uma placa só pode ter um registro ativo por vez
- [ ] Expor camada de repositório consumível pelo backend Node.js

## Out of Scope

| Feature                        | Reason                                              |
| ------------------------------ | --------------------------------------------------- |
| Autenticação de usuários       | MVP da guarita assume operador único local          |
| Backup automatizado / replicação | Escopo acadêmico; volume baixo de dados           |
| Múltiplos estacionamentos      | Um único pátio por instância                        |
| Cache (Redis)                  | Complexidade desnecessária para o MVP               |

---

## Assumptions & Open Questions

| Assumption / decision              | Chosen default                        | Rationale                                      | Confirmed? |
| ---------------------------------- | ------------------------------------- | ---------------------------------------------- | ---------- |
| Acesso ao banco                    | Driver `pg` (node-postgres)           | SQL direto; schema gerenciado via scripts SQL  | y          |
| Ferramenta de gestão visual        | DBeaver Community                     | Visualização de tabelas, consultas e diagrama ER | y        |
| Volume esperado                    | < 10.000 registros                    | Escopo acadêmico; índices simples suficientes  | y          |
| Timezone dos timestamps            | UTC no banco; exibição em America/Sao_Paulo no app | Evita ambiguidade entre camadas           | n          |
| Conexão em desenvolvimento         | `DATABASE_URL` via `.env`             | Padrão do ecossistema Node/Prisma              | y          |

**Open questions:** nenhuma — defaults registrados acima; confirmar ORM com o grupo na revisão.

---

## User Stories

### P1: Infraestrutura do banco via Docker ⭐ MVP

**User Story**: Como desenvolvedor, quero subir o PostgreSQL com um comando para que qualquer integrante teste a aplicação após o clone.

**Why P1**: Sem banco rodando, nenhuma outra camada pode ser integrada ou demonstrada.

**Acceptance Criteria**:

1. WHEN o desenvolvedor executa `docker compose up -d` na raiz do repositório THEN o sistema SHALL iniciar um container PostgreSQL acessível na porta `5432`
2. WHEN o container estiver saudável THEN o sistema SHALL expor as variáveis `POSTGRES_DB`, `POSTGRES_USER` e `POSTGRES_PASSWORD` documentadas em `.env.example`
3. IF o arquivo `.env` não existir THEN o desenvolvedor SHALL conseguir criar a partir de `.env.example` sem editar o `docker-compose.yml`

**Independent Test**: Clonar o repo, copiar `.env.example` para `.env`, rodar `docker compose up -d` e conectar com `psql` ou cliente equivalente.

---

### P1: Schema de registros de estacionamento ⭐ MVP

**User Story**: Como sistema, quero persistir entradas e saídas de veículos para que o cálculo de tempo e valor seja possível na saída.

**Why P1**: É o núcleo do domínio; sem tabela e migrations o backend não tem onde gravar.

**Acceptance Criteria**:

1. The persistence layer SHALL manter a tabela `registros_estacionamento` com colunas: `id` (UUID PK), `placa` (VARCHAR 8), `entrada_em` (TIMESTAMPTZ NOT NULL), `saida_em` (TIMESTAMPTZ NULL), `valor_cobrado` (DECIMAL(10,2) NULL), `status` (ENUM: `ativo` \| `finalizado`), `criado_em` (TIMESTAMPTZ NOT NULL)
2. WHEN um veículo entra THEN the persistence layer SHALL inserir registro com `status = ativo`, `saida_em = NULL` e `valor_cobrado = NULL`
3. WHEN um veículo sai THEN the persistence layer SHALL atualizar `saida_em`, `valor_cobrado` e `status = finalizado` no registro ativo da placa
4. IF existir registro com `status = ativo` para a mesma placa THEN the persistence layer SHALL impedir nova entrada (constraint ou validação de aplicação com erro identificável)

**Independent Test**: Executar migration, inserir entrada, tentar segunda entrada da mesma placa (deve falhar), registrar saída e verificar campos preenchidos.

---

### P2: Camada de repositório

**User Story**: Como desenvolvedor do backend, quero uma interface de repositório para que a API não acesse SQL diretamente.

**Why P2**: Separação de responsabilidades e testabilidade; contrato claro entre persistência e API.

**Acceptance Criteria**:

1. The repository SHALL expor os métodos: `registrarEntrada(placa)`, `registrarSaida(placa)`, `buscarAtivoPorPlaca(placa)`, `listarAtivos()`, `historicoPorPlaca(placa)`
2. WHEN `registrarEntrada` é chamado com placa válida THEN the repository SHALL retornar o registro criado com `status = ativo`
3. WHEN `registrarSaida` é chamado para placa com registro ativo THEN the repository SHALL retornar o registro atualizado com `saida_em` e `valor_cobrado` preenchidos
4. IF `registrarSaida` é chamado para placa sem registro ativo THEN the repository SHALL lançar erro com código `REGISTRO_NAO_ENCONTRADO`
5. IF a conexão com o banco falhar THEN the repository SHALL propagar erro identificável sem corromper dados parciais

**Independent Test**: Testes de integração contra banco Docker com cenários de entrada, saída, duplicata e placa inexistente.

---

### P3: Índices e consultas de histórico

**User Story**: Como operador da guarita, quero consultar o histórico de uma placa para verificar estadias anteriores.

**Why P3**: Funcionalidade complementar; não bloqueia MVP de entrada/saída.

**Acceptance Criteria**:

1. The persistence layer SHALL manter índice em `placa` para consultas por veículo
2. WHEN `historicoPorPlaca` é chamado THEN the repository SHALL retornar registros ordenados por `entrada_em` descendente
3. WHILE `status = ativo` the registro SHALL aparecer em `listarAtivos()` e não em histórico finalizado até a saída

**Independent Test**: Registrar 3 estadias da mesma placa (entrada/saída) e verificar ordenação do histórico.

---

## Edge Cases

- IF a placa for enviada em minúsculas THEN the persistence layer SHALL normalizar para maiúsculas antes de persistir
- IF `docker compose` for executado com volume já existente THEN the system SHALL preservar dados anteriores (volume nomeado `pgdata`)
- IF migration falhar no meio THEN the system SHALL não deixar schema em estado inconsistente (migrations transacionais do Prisma)
- WHEN container do banco reinicia THEN the system SHALL recuperar dados do volume persistente

---

## Requirement Traceability

| Requirement ID | Story                              | Phase  | Status  |
| -------------- | ---------------------------------- | ------ | ------- |
| DB-01          | P1: Infraestrutura Docker          | Design | Pending |
| DB-02          | P1: Infraestrutura Docker          | Design | Pending |
| DB-03          | P1: Infraestrutura Docker          | Design | Pending |
| DB-04          | P1: Schema                         | Design | Pending |
| DB-05          | P1: Schema                         | Design | Pending |
| DB-06          | P1: Schema                         | Design | Pending |
| DB-07          | P1: Schema                         | Design | Pending |
| DB-08          | P2: Repositório                    | Design | Pending |
| DB-09          | P2: Repositório                    | Design | Pending |
| DB-10          | P2: Repositório                    | Design | Pending |
| DB-11          | P2: Repositório                    | Design | Pending |
| DB-12          | P2: Repositório                    | Design | Pending |
| DB-13          | P3: Índices e histórico            | Design | Pending |
| DB-14          | P3: Índices e histórico            | Design | Pending |
| DB-15          | P3: Índices e histórico            | Design | Pending |

**Coverage:** 15 total, 0 mapped to tasks, 15 unmapped ⚠️

---

## Success Criteria

- [ ] `docker compose up -d` sobe o banco em menos de 30 segundos em máquina de desenvolvimento
- [ ] Migrations aplicam schema sem erro em banco limpo
- [ ] Testes de integração do repositório passam com banco Docker
- [ ] README documenta setup do banco em até 5 passos
