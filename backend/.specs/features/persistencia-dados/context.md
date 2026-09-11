# Persistência de Dados — Context (Discuss)

Decisões capturadas na fase Discuss para dimensões implícitas de persistência.

## Input validation & bounds

- Placa: máximo 8 caracteres após normalização (formato antigo `ABC-1234` ou Mercosul `ABC1D23`)
- `valor_cobrado`: DECIMAL(10,2), sempre ≥ 0 quando preenchido
- Timestamps: TIMESTAMPTZ obrigatório em `entrada_em` e `criado_em`

## Failure / partial-failure states

- Falha de conexão: propagar erro; não inserir registro parcial
- Script SQL falha: desenvolvedor corrige `init.sql` e recria volume com `docker compose down -v`
- Container parado: backend retorna erro 503 (responsabilidade da API, consumindo erro do repositório)

## Idempotency / duplicate handling

- Entrada duplicada de placa ativa: rejeitar com erro `PLACA_JA_ATIVA`
- Saída repetida da mesma placa: rejeitar com erro `REGISTRO_NAO_ENCONTRADO` (não há registro ativo)

## Auth boundaries

- N/A — banco acessível apenas pelo backend na rede local/Docker; sem exposição pública direta

## Concurrency / ordering

- Duas entradas simultâneas da mesma placa: constraint UNIQUE parcial (`status = ativo`) ou transação serializable no repositório
- Ordenação de histórico: sempre por `entrada_em DESC`

## Data lifecycle / expiry

- N/A — sem TTL ou arquivamento no MVP; dados permanecem indefinidamente

## Observability

- Logs de conexão e erro no backend (não no container Postgres por padrão)
- Healthcheck do container via `pg_isready` no docker-compose

## External-dependency failure

- PostgreSQL indisponível: backend deve falhar de forma explícita; sem fallback em memória

## State-transition integrity

```
(novo) → ativo        via registrarEntrada
ativo → finalizado    via registrarSaida
finalizado → ativo    NÃO permitido (nova entrada cria novo registro)
```
