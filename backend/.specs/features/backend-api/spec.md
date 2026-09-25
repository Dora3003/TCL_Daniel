# Backend API — Specification

## Problem Statement

A guarita precisa registrar a entrada de veículos com dados do motorista e do carro, emitir um token de ticket e permitir que o cliente pague a estadia pelo site. A catraca só libera a saída se o pagamento for recente. Sem a API, o frontend da guarita e o site do cliente não têm contrato para cadastro, pagamento, multa e consulta.

## Goals

- [x] Expor REST para cadastro na guarita, login por token, pagamento, multa, saída e listagem
- [x] Gerar token no formato `U3T98LX` (7 caracteres alfanuméricos maiúsculos) e URL de login para o ticket
- [x] Cobrar R$ 5,00 por hora com mínimo de 1 hora (AD-004) e multa de 15% se a janela de 10 minutos expirar
- [x] Responder JSON padronizado com códigos HTTP corretos

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Impressão física do ticket | Pressuposto da atividade; a API só devolve token e URL |
| Gateway de pagamento real | Pagamento é simulado: POST marca como pago |
| JWT / contas de usuário | O token do ticket é a credencial do cliente |
| Geração de imagem de QR Code | O cliente monta o QR a partir de `loginUrl` |
| Hardware da catraca | A catraca consome `POST /api/saida` como qualquer cliente HTTP |
| Multi-tenant | Um estacionamento por instância |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Framework HTTP | Express.js | Já registrado no design anterior e familiar ao grupo | y |
| Linguagem | TypeScript | Tipagem alinhada ao repositório Node existente | y |
| CORS | Liberado para `http://localhost:5173` | Dev local Vite | y |
| Arredondamento de horas | Teto (`ceil`): 1h01 = 2h cobradas | Comum em estacionamento; AD-004 | y |
| Formato do token | 7 caracteres `[A-Z0-9]`, exemplo `U3T98LX` | Enunciado do case | y |
| URL de login do ticket | `{FRONTEND_URL}/?token={TOKEN}` | QR e login usam o mesmo endereço; impressão é pressuposto | y |
| Pagamento | Simulado (sem cartão/PIX real) | MVP acadêmico | y |
| Janela de saída | 10 minutos após `pagoEm` (ou após pagamento da multa) | Enunciado do case | y |
| Multa | 15% de `valorCobrado` da estadia, arredondado para 2 casas | Enunciado do case | y |
| Pagamento desconsiderado | Timestamp de autorização de saída é invalidado; valor da estadia permanece; multa fica pendente | "horário de pagamento desconsiderado" autoriza a catraca, não estorna a estadia | y |
| Campos extras do carro | `modelo` e `cor` opcionais; `motoristaNome` obrigatório | Cadastro da guarita pede nome e informações do carro | y |
| Porta da API | `3000` | Alinhado à spec do frontend | y |

**Open questions:** none

---

## User Stories

### P1: Cadastrar entrada na guarita ⭐ MVP

**User Story**: Como guarda da guarita, quero cadastrar placa, nome do motorista e dados do carro para gerar o token do ticket.

**Why P1**: Sem entrada e token o cliente não acessa o site e a catraca não tem o que validar.

**Acceptance Criteria**:

1. WHEN the guard sends `POST /api/entrada` with `{ "placa": "ABC-1234", "motoristaNome": "Ana Souza", "modelo": "Onix", "cor": "Prata" }` THEN the API SHALL create an active record and return `201` with `id`, `placa`, `motoristaNome`, `modelo`, `cor`, `token`, `loginUrl`, `entradaEm` and `status: "ativo"`
2. The API SHALL generate `token` as exactly 7 uppercase alphanumeric characters unique among all records
3. The API SHALL set `loginUrl` to `{FRONTEND_URL}/?token={token}`
4. IF `placa` is invalid THEN the API SHALL return `400` with `{ "erro": "PLACA_INVALIDA", "mensagem": "..." }`
5. IF `motoristaNome` is missing or blank after trim THEN the API SHALL return `400` with `{ "erro": "DADOS_INVALIDOS", "mensagem": "..." }`
6. IF the plate already has a record with status `ativo`, `pago` or `multa_pendente` THEN the API SHALL return `409` with `{ "erro": "PLACA_JA_ATIVA", "mensagem": "..." }`
7. The API SHALL normalize the plate to uppercase and strip spaces and hyphens before validating and persisting

**Independent Test**: `POST /api/entrada` with valid body returns 201 and a 7-char token; a second POST with the same plate returns 409.

---

### P1: Login do cliente por token ⭐ MVP

**User Story**: Como cliente, quero informar o token do papel para ver tempo, valor e status do meu ticket.

**Why P1**: É o equivalente ao login do site aberto pelo QR.

**Acceptance Criteria**:

1. WHEN the client sends `GET /api/tickets/:token` with a valid active token THEN the API SHALL return `200` with `placa`, `motoristaNome`, `entradaEm`, `status`, `duracaoMinutos`, `valorAtual`, `valorMulta` and `janelaSaidaExpiraEm`
2. IF the token does not exist THEN the API SHALL return `404` with `{ "erro": "TOKEN_INVALIDO", "mensagem": "..." }`
3. IF the token format is not 7 alphanumeric characters THEN the API SHALL return `400` with `{ "erro": "TOKEN_INVALIDO", "mensagem": "..." }`
4. WHILE the record status is `ativo` the API SHALL compute `valorAtual` with the same tariff rule used at payment time (`ceil` hours × 5.00, minimum 1 hour)

**Independent Test**: Create an entry, GET the ticket by token, see `status: "ativo"` and a positive `valorAtual`.

---

### P1: Pagar estadia ⭐ MVP

**User Story**: Como cliente, quero pagar o valor do tempo de estadia para autorizar a saída.

**Why P1**: Sem pagamento a catraca não libera.

**Acceptance Criteria**:

1. WHEN the client sends `POST /api/tickets/:token/pagamentos` for a record with status `ativo` THEN the API SHALL persist `valorCobrado`, set `pagoEm` to now, set `status` to `pago` and return `200` with those fields plus `janelaSaidaExpiraEm` equal to `pagoEm + 10 minutes`
2. IF the token has no in-parking record (`ativo`, `pago` or `multa_pendente`) THEN the API SHALL return `404` with `{ "erro": "TOKEN_INVALIDO", "mensagem": "..." }`
3. IF the record status is already `pago` THEN the API SHALL return `409` with `{ "erro": "PAGAMENTO_JA_REALIZADO", "mensagem": "..." }`
4. IF the record status is `multa_pendente` THEN the API SHALL return `409` with `{ "erro": "MULTA_PENDENTE", "mensagem": "..." }`

**Independent Test**: Pay an active ticket and GET it again with `status: "pago"` and a 10-minute expiry.

---

### P1: Liberar saída na catraca ⭐ MVP

**User Story**: Como catraca, quero validar o token na saída só se o pagamento estiver dentro de 10 minutos.

**Why P1**: Fecha o ciclo operacional do case.

**Acceptance Criteria**:

1. WHEN the gate sends `POST /api/saida` with `{ "token": "U3T98LX" }` and the record is `pago` and now is strictly less than 10 minutes after `pagoEm` THEN the API SHALL set `saidaEm` to now, set `status` to `finalizado` and return `200` with `entradaEm`, `saidaEm`, `duracaoMinutos`, `valorCobrado` and `status: "finalizado"`
2. IF the record is `pago` and now is 10 minutes or more after `pagoEm` THEN the API SHALL discard the exit authorization, set `status` to `multa_pendente`, set `valorMulta` to 15% of `valorCobrado` rounded to 2 decimal places, clear `pagoEm` and return `409` with `{ "erro": "JANELA_SAIDA_EXPIRADA", "valorMulta": ..., "mensagem": "..." }`
3. IF the record is `ativo` THEN the API SHALL return `402` with `{ "erro": "PAGAMENTO_PENDENTE", "mensagem": "..." }`
4. IF the record is `multa_pendente` THEN the API SHALL return `402` with `{ "erro": "MULTA_PENDENTE", "valorMulta": ..., "mensagem": "..." }`
5. IF the token does not match an in-parking record THEN the API SHALL return `404` with `{ "erro": "TOKEN_INVALIDO", "mensagem": "..." }`

**Independent Test**: Pay, exit immediately (200 finalizado); pay, advance 10 minutes, exit (409 with multa).

---

### P1: Pagar multa ⭐ MVP

**User Story**: Como cliente, quero pagar a multa de 15% no site para obter uma nova janela de 10 minutos.

**Why P1**: Sem isso o veículo fica preso após a janela expirar.

**Acceptance Criteria**:

1. WHEN the client sends `POST /api/tickets/:token/multas` for status `multa_pendente` THEN the API SHALL persist `multaPagaEm` as now, set `pagoEm` to now, set `status` to `pago` and return `200` with `valorMulta`, `pagoEm`, `status: "pago"` and `janelaSaidaExpiraEm` equal to now + 10 minutes
2. IF the record is not `multa_pendente` THEN the API SHALL return `409` with `{ "erro": "MULTA_NAO_PENDENTE", "mensagem": "..." }`
3. IF the token is unknown THEN the API SHALL return `404` with `{ "erro": "TOKEN_INVALIDO", "mensagem": "..." }`

**Independent Test**: Force expired window, pay multa, exit within 10 minutes succeeds.

---

### P2: Listar veículos no pátio

**User Story**: Como guarda, quero ver todos os veículos que ainda estão no estacionamento.

**Why P2**: Operação da guarita além do cadastro.

**Acceptance Criteria**:

1. WHEN the guard sends `GET /api/ativos` THEN the API SHALL return `200` with an array of records whose status is `ativo`, `pago` or `multa_pendente`
2. WHEN there are no in-parking vehicles THEN the API SHALL return `200` with `[]`
3. The API SHALL include in each item `placa`, `motoristaNome`, `token`, `entradaEm`, `status` and `tempoDecorridoMinutos`

**Independent Test**: Two entries, one successful exit, list returns one item.

---

### P3: Histórico por placa

**User Story**: Como guarda, quero consultar estadias finalizadas de uma placa.

**Why P3**: Consulta útil na apresentação, não bloqueia o fluxo principal.

**Acceptance Criteria**:

1. WHEN the guard sends `GET /api/historico/:placa` THEN the API SHALL return `200` with finished records ordered by `entradaEm` descending
2. IF the plate is invalid THEN the API SHALL return `400` with `{ "erro": "PLACA_INVALIDA" }`
3. WHEN the plate never parked THEN the API SHALL return `200` with `[]`

**Independent Test**: Finish one stay, query history, see one `finalizado` item.

---

## Edge Cases

- IF the database is unavailable THEN the API SHALL return `503` with `{ "erro": "SERVICO_INDISPONIVEL" }`
- IF the request body is malformed JSON THEN the API SHALL return `400` with `{ "erro": "REQUISICAO_INVALIDA" }`
- IF an unsupported HTTP method is used on a known path THEN the API SHALL return `405`
- WHEN a Mercosur plate (`ABC1D23`) is sent THEN the API SHALL accept it the same way as `ABC-1234`
- WHEN `GET /api/health` is called and the database is up THEN the API SHALL return `200` with `{ "status": "ok", "db": "connected" }`
- WHEN `GET /api/health` is called and the database is down THEN the API SHALL return `503` with `{ "status": "ok", "db": "disconnected" }`
- WHEN a stay lasts 30 minutes THEN the API SHALL charge `5.00`
- WHEN a stay lasts 61 minutes THEN the API SHALL charge `10.00`
- WHEN `valorCobrado` is `10.00` and the window expires THEN the API SHALL set `valorMulta` to `1.50`

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| API-01 | P1: Entrada | Execute | Verified |
| API-02 | P1: Entrada | Execute | Verified |
| API-03 | P1: Entrada | Execute | Verified |
| API-04 | P1: Entrada | Execute | Verified |
| API-05 | P1: Entrada | Execute | Verified |
| API-06 | P1: Entrada | Execute | Verified |
| API-07 | P1: Entrada | Execute | Verified |
| API-08 | P1: Login token | Execute | Verified |
| API-09 | P1: Login token | Execute | Verified |
| API-10 | P1: Login token | Execute | Verified |
| API-11 | P1: Login token | Execute | Verified |
| API-12 | P1: Pagamento | Execute | Verified |
| API-13 | P1: Pagamento | Execute | Verified |
| API-14 | P1: Pagamento | Execute | Verified |
| API-15 | P1: Pagamento | Execute | Verified |
| API-16 | P1: Saída | Execute | Verified |
| API-17 | P1: Saída | Execute | Verified |
| API-18 | P1: Saída | Execute | Verified |
| API-19 | P1: Saída | Execute | Verified |
| API-20 | P1: Saída | Execute | Verified |
| API-21 | P1: Multa | Execute | Verified |
| API-22 | P1: Multa | Execute | Verified |
| API-23 | P1: Multa | Execute | Verified |
| API-24 | P2: Ativos | Execute | Verified |
| API-25 | P2: Ativos | Execute | Verified |
| API-26 | P2: Ativos | Execute | Verified |
| API-27 | P3: Histórico | Execute | Verified |
| API-28 | P3: Histórico | Execute | Verified |
| API-29 | P3: Histórico | Execute | Verified |

**Coverage:** 29 total, 29 mapped to tasks T1–T5, 0 unmapped

---

## Success Criteria

- [x] Guard can register a car and receive token plus `loginUrl`
- [x] Client can open ticket, pay, and leave within 10 minutes
- [x] Expired window creates a 15% fine that must be paid before exit
- [x] Tariff and plate validation are covered by unit tests
- [x] API starts with `npm run dev` after Docker Postgres is up
