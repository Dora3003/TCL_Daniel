# Backend API — Specification

## Problem Statement

A guarita precisa de uma API que orquestre o fluxo de entrada e saída de veículos, aplique regras de negócio (validação de placa, cálculo de valor por tempo) e persista os dados via camada de repositório.

## Goals

- [ ] Expor endpoints REST para entrada, saída e consulta de veículos
- [ ] Validar placas no formato brasileiro antes de persistir
- [ ] Calcular valor cobrado na saída: R$ 5,00/hora, mínimo 1 hora (AD-004)
- [ ] Retornar respostas JSON padronizadas com códigos HTTP corretos

## Out of Scope

| Feature              | Reason                                    |
| -------------------- | ----------------------------------------- |
| Autenticação JWT     | Operador único local no MVP               |
| WebSocket / tempo real | Polling ou refresh manual no frontend   |
| Pagamento integrado  | Apenas registro do valor calculado        |
| Multi-tenant         | Um estacionamento por instância           |

---

## Assumptions & Open Questions

| Assumption / decision     | Chosen default              | Rationale                               | Confirmed? |
| ------------------------- | --------------------------- | --------------------------------------- | ---------- |
| Framework HTTP            | Express.js                  | Simplicidade e familiaridade do grupo   | n          |
| Linguagem                 | TypeScript                  | Tipagem compartilhada com Prisma        | n          |
| CORS                      | Liberado para `localhost:5173` (Vite) | Dev local React                  | y          |
| Arredondamento de horas   | Teto (ceil): 1h01 = 2h cobradas | Comum em estacionamentos          | n          |

**Open questions:** confirmar framework e regra de arredondamento com o grupo.

---

## User Stories

### P1: Registrar entrada de veículo ⭐ MVP

**User Story**: Como operador da guarita, quero registrar a placa de um veículo que entra para que o sistema comece a contar o tempo.

**Why P1**: Primeira ação do fluxo principal; sem entrada não há saída nem cobrança.

**Acceptance Criteria**:

1. WHEN o operador envia `POST /api/entrada` com `{ "placa": "ABC-1234" }` THEN the API SHALL criar registro ativo e retornar `201` com corpo contendo `id`, `placa`, `entradaEm` e `status: "ativo"`
2. IF a placa estiver em formato inválido THEN the API SHALL retornar `400` com `{ "erro": "PLACA_INVALIDA", "mensagem": "..." }`
3. IF a placa já possuir registro ativo THEN the API SHALL retornar `409` com `{ "erro": "PLACA_JA_ATIVA", "mensagem": "..." }`
4. The API SHALL normalizar placa para maiúsculas e remover espaços antes de validar e persistir

**Independent Test**: `curl -X POST /api/entrada -d '{"placa":"abc-1234"}'` retorna 201; segunda chamada com mesma placa retorna 409.

---

### P1: Registrar saída e calcular valor ⭐ MVP

**User Story**: Como operador da guarita, quero registrar a saída de um veículo e ver o valor cobrado baseado no tempo de permanência.

**Why P1**: Completa o ciclo de negócio; é a funcionalidade central da demonstração.

**Acceptance Criteria**:

1. WHEN o operador envia `POST /api/saida` com `{ "placa": "ABC-1234" }` THEN the API SHALL calcular duração, aplicar tarifa e retornar `200` com `entradaEm`, `saidaEm`, `duracaoMinutos`, `valorCobrado` e `status: "finalizado"`
2. The API SHALL calcular valor como `ceil(horas) * 5.00` com mínimo de 1 hora (ex.: 30 min = R$ 5,00; 1h01 = R$ 10,00)
3. IF não existir registro ativo para a placa THEN the API SHALL retornar `404` com `{ "erro": "REGISTRO_NAO_ENCONTRADO", "mensagem": "..." }`
4. WHEN a saída é registrada THEN the API SHALL persistir `valorCobrado` e `saidaEm` via repositório

**Independent Test**: Registrar entrada, aguardar ou mockar tempo, chamar saída e verificar `valorCobrado` conforme regra.

---

### P2: Listar veículos no pátio

**User Story**: Como operador da guarita, quero ver todos os veículos atualmente no estacionamento.

**Why P2**: Visão operacional essencial; complementa entrada/saída.

**Acceptance Criteria**:

1. WHEN o operador envia `GET /api/ativos` THEN the API SHALL retornar `200` com array de registros com `status: "ativo"`
2. WHEN não houver veículos ativos THEN the API SHALL retornar `200` com array vazio `[]`
3. The API SHALL incluir em cada item: `placa`, `entradaEm` e tempo decorrido calculado (`tempoDecorridoMinutos`)

**Independent Test**: Registrar 2 entradas, listar ativos, registrar 1 saída, listar novamente (1 item).

---

### P3: Consultar histórico por placa

**User Story**: Como operador, quero consultar o histórico de estadias de uma placa específica.

**Why P3**: Funcionalidade de consulta; útil na apresentação mas não bloqueia MVP.

**Acceptance Criteria**:

1. WHEN o operador envia `GET /api/historico/:placa` THEN the API SHALL retornar `200` com array de registros finalizados ordenados por `entradaEm` descendente
2. IF a placa for inválida THEN the API SHALL retornar `400` com `{ "erro": "PLACA_INVALIDA" }`
3. WHEN a placa nunca estacionou THEN the API SHALL retornar `200` com array vazio `[]`

**Independent Test**: Registrar entrada/saída de uma placa, consultar histórico e verificar registro finalizado.

---

## Edge Cases

- IF o banco estiver indisponível THEN the API SHALL retornar `503` com `{ "erro": "SERVICO_INDISPONIVEL" }`
- IF corpo da requisição estiver malformado THEN the API SHALL retornar `400` com `{ "erro": "REQUISICAO_INVALIDA" }`
- IF método HTTP não suportado THEN the API SHALL retornar `405`
- WHEN placa Mercosul (`ABC1D23`) é enviada THEN the API SHALL aceitar e normalizar igual ao formato antigo

---

## Requirement Traceability

| Requirement ID | Story                    | Phase  | Status  |
| -------------- | ------------------------ | ------ | ------- |
| API-01         | P1: Entrada              | Design | Pending |
| API-02         | P1: Entrada              | Design | Pending |
| API-03         | P1: Entrada              | Design | Pending |
| API-04         | P1: Entrada              | Design | Pending |
| API-05         | P1: Saída                | Design | Pending |
| API-06         | P1: Saída                | Design | Pending |
| API-07         | P1: Saída                | Design | Pending |
| API-08         | P1: Saída                | Design | Pending |
| API-09         | P2: Listar ativos        | Design | Pending |
| API-10         | P2: Listar ativos        | Design | Pending |
| API-11         | P2: Listar ativos        | Design | Pending |
| API-12         | P3: Histórico            | Design | Pending |
| API-13         | P3: Histórico            | Design | Pending |
| API-14         | P3: Histórico            | Design | Pending |

**Coverage:** 14 total, 0 mapped to tasks, 14 unmapped ⚠️

---

## Success Criteria

- [ ] Todos os endpoints P1 respondem corretamente via curl/Postman
- [ ] Cálculo de valor cobrado coberto por testes unitários
- [ ] Validação de placa coberta por testes unitários
- [ ] API sobe com `npm run dev` após banco Docker estar ativo
