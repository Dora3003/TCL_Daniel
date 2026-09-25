# Backend API — Context (Discuss)

## Input validation & bounds

- Placa: antigo `^[A-Z]{3}-?\d{4}$` ou Mercosul `^[A-Z]{3}\d[A-Z]\d{2}$` após normalização (maiúsculas, sem espaços/hífen)
- Token: exatamente 7 caracteres `[A-Z0-9]`
- `motoristaNome`: obrigatório, 1–120 caracteres após trim
- `modelo` e `cor`: opcionais, máximo 60 e 30 caracteres
- Body JSON obrigatório em POST; campos extras ignorados

## Failure / partial-failure states

- Erro de repositório mapeado para HTTP (409 duplicata, 404 token, 503 banco)
- Erros não tratados: 500 com log interno, sem stack na resposta
- Pagamento e multa são transações: ou persistem status+valores juntos, ou rollback

## Idempotency / duplicate handling

- POST entrada não é idempotente: placa ainda no pátio → 409
- POST pagamento com status `pago` → 409 `PAGAMENTO_JA_REALIZADO`
- POST multa só no estado `multa_pendente`

## Auth boundaries

- N/A — API aberta no MVP acadêmico
- Token do ticket é o identificador do cliente; não há senha
- Rate limit: N/A

## Concurrency / ordering

- Duas saídas simultâneas: a primeira que passar na transação vence; a segunda vê status já `finalizado` e recebe 404
- Cálculo de valor usa relógio do servidor no momento da requisição
- Janela de 10 minutos usa `now - pagoEm >= 10 minutes` para expirar (limite inclusivo no vencimento)

## Data lifecycle

- API não apaga registros; saída apenas finaliza
- Token permanece único para sempre, inclusive após `finalizado`

## Observability

- Middleware de log (método, path, status, duração)
- `GET /api/health` reporta conexão com o banco

## External-dependency failure

- PostgreSQL down: health `db: "disconnected"`; mutações e consultas retornam 503

## State-transition integrity

```
(novo) → ativo              POST /api/entrada
ativo → pago                POST /api/tickets/:token/pagamentos
pago → finalizado           POST /api/saida  (now - pagoEm < 10 min)
pago → multa_pendente       POST /api/saida  (now - pagoEm >= 10 min)
multa_pendente → pago       POST /api/tickets/:token/multas
finalizado → *              não permitido (nova entrada cria novo registro)
```
