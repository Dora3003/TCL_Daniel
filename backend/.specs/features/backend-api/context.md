# Backend API — Context (Discuss)

## Input validation & bounds

- Placa: regex `^[A-Z]{3}-?\d{4}$` (antigo) ou `^[A-Z]{3}\d[A-Z]\d{2}$` (Mercosul)
- Body JSON obrigatório em POST; campos extras ignorados
- `placa` obrigatória e não vazia após trim

## Failure / partial-failure states

- Erro de repositório mapeado para HTTP adequado (409 duplicata, 404 não encontrado)
- Erro de conexão DB → 503
- Erros não tratados → 500 com log interno (sem stack trace na resposta)

## Idempotency / duplicate handling

- POST entrada não é idempotente: segunda chamada com mesma placa ativa → 409
- POST saída não é idempotente: segunda chamada → 404 (sem registro ativo)

## Auth boundaries

- N/A — API aberta em ambiente de desenvolvimento
- Rate limit: N/A para MVP acadêmico

## Concurrency / ordering

- Duas saídas simultâneas da mesma placa: primeira vence; segunda recebe 404
- Cálculo de valor usa `saidaEm = now()` no momento da requisição

## Data lifecycle

- N/A — API não deleta registros

## Observability

- Middleware de log de requisições (método, path, status, duração)
- Endpoint `GET /api/health` retorna `{ "status": "ok", "db": "connected" }`

## External-dependency failure

- PostgreSQL down: health retorna `db: "disconnected"` e endpoints retornam 503

## State-transition integrity

- Entrada só permitida se não há registro ativo
- Saída só permitida se há registro ativo
- Valor calculado exclusivamente na saída, nunca na entrada
