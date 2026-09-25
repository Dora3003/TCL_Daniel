# Persistência de Dados — Design

## Arquitetura

```
┌─────────────────────────────────────────┐
│  Backend API (Node.js)                  │
│  └── RegistroService                    │
│       └── RegistroRepository            │
└──────────────────┬──────────────────────┘
                   │ pg (node-postgres)
                   ▼
┌─────────────────────────────────────────┐
│  PostgreSQL 16 (Docker)                 │
│  └── registros_estacionamento           │
└──────────────────┬──────────────────────┘
                   │ conexão JDBC
                   ▼
┌─────────────────────────────────────────┐
│  DBeaver (ferramenta local)             │
│  Visualização, consultas e validação    │
└─────────────────────────────────────────┘
```

## Docker Compose

Arquivo na raiz: `docker-compose.yml`

- Imagem: `postgres:16-alpine`
- Porta: `5432`
- Volume persistente: `pgdata`
- Init script: `database/init.sql` (executado na primeira subida)

## Schema SQL

Definido em `database/init.sql` e replicado em `database/schema.sql` para execução manual no DBeaver.

```sql
CREATE TYPE status_registro AS ENUM ('ativo', 'finalizado');

CREATE TABLE registros_estacionamento (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa           VARCHAR(8) NOT NULL,
    entrada_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    saida_em        TIMESTAMPTZ,
    valor_cobrado   DECIMAL(10, 2),
    status          status_registro NOT NULL DEFAULT 'ativo',
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_placa_ativa
    ON registros_estacionamento (placa)
    WHERE status = 'ativo';
```

## DBeaver — Conexão

| Campo    | Valor            |
| -------- | ---------------- |
| Host     | `localhost`      |
| Port     | `5432`           |
| Database | `estacionamento` |
| User     | `app`            |
| Password | `app`            |

Documentação completa: `database/README.md`

## Interface do Repositório

```typescript
interface Registro {
  id: string;
  placa: string;
  entradaEm: Date;
  saidaEm: Date | null;
  valorCobrado: number | null;
  status: 'ativo' | 'finalizado';
  criadoEm: Date;
}

class RegistroRepository {
  registrarEntrada(placa: string): Promise<Registro>;
  registrarSaida(placa: string, valorCobrado: number): Promise<Registro>;
  buscarAtivoPorPlaca(placa: string): Promise<Registro | null>;
  listarAtivos(): Promise<Registro[]>;
  historicoPorPlaca(placa: string): Promise<Registro[]>;
}
```

> O cálculo de `valorCobrado` é responsabilidade do **backend**. O repositório apenas persiste o valor recebido na saída.

## Estrutura de arquivos

```
/
├── docker-compose.yml
├── .env.example
├── database/
│   ├── README.md          # Guia DBeaver
│   ├── init.sql           # Schema automático (Docker)
│   ├── schema.sql         # Schema manual (DBeaver)
│   └── queries.sql        # Consultas de teste
└── backend/
    ├── .specs/features/
    │   ├── persistencia-dados/
    │   └── backend-api/
    └── src/
        ├── db/pool.ts
        ├── repositories/registro.repository.ts
        └── types/registro.ts
```

## Variáveis de ambiente

| Variável          | Exemplo                                              |
| ----------------- | ---------------------------------------------------- |
| DATABASE_URL      | `postgresql://app:app@localhost:5432/estacionamento` |
| POSTGRES_DB       | `estacionamento`                                     |
| POSTGRES_USER     | `app`                                                |
| POSTGRES_PASSWORD | `app`                                                |
