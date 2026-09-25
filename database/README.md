# Banco de Dados — PostgreSQL + DBeaver

## Subir o banco

```bash
cp .env.example .env
docker compose up -d
```

O schema é criado automaticamente via `init.sql` na primeira inicialização do container.

Se o volume já existir com schema antigo, recrie:

```bash
docker compose down -v
docker compose up -d
```

## Conectar no DBeaver

1. Instale o [DBeaver](https://dbeaver.io/download/) (Community Edition é suficiente)
2. **Database → New Database Connection → PostgreSQL**
3. Preencha:

| Campo    | Valor           |
| -------- | --------------- |
| Host     | `localhost`     |
| Port     | `5432`          |
| Database | `estacionamento`|
| Username | `app`           |
| Password | `app`           |

4. Clique em **Test Connection** → **Finish**

## Navegar no schema

Após conectar, expanda:

```
estacionamento → Schemas → public → Tables → registros_estacionamento
```

Tipos customizados em `public → Types → status_registro`.

## Consultas de teste

Use o arquivo `queries.sql` como ponto de partida. Exemplos rápidos:

```sql
-- Inserir entrada manual (teste)
INSERT INTO registros_estacionamento (placa, token, motorista_nome, entrada_em, status)
VALUES ('ABC1234', 'U3T98LX', 'Ana Souza', NOW(), 'ativo');

-- Listar ativos
SELECT * FROM registros_estacionamento WHERE status = 'ativo';
```

## Resetar o banco (apaga todos os dados)

```bash
docker compose down -v
docker compose up -d
```

> O flag `-v` remove o volume `pgdata`, forçando a recriação do schema.

## Diagrama ER (DBeaver)

No DBeaver: clique com botão direito no schema `public` → **View Diagram** para visualizar a tabela e relacionamentos.
