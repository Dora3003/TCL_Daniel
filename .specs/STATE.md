# Estado do Projeto — Estacionamento Guarita

## Visão Geral

Sistema de controle de estacionamento com duas frentes: guarita (cadastro e consulta) e cliente (login por token, pagamento e multa). A catraca libera a saída só com pagamento válido nos últimos 10 minutos.

| Camada       | Tecnologia                      |
| ------------ | ------------------------------- |
| Frontend     | React + HTML/CSS                |
| Backend      | Node.js + Express + TypeScript  |
| Persistência | PostgreSQL + Docker + DBeaver   |

## Estrutura do Repositório

```
/
├── docker-compose.yml
├── .env.example
├── database/
├── .specs/STATE.md
├── backend/
│   ├── .specs/features/
│   └── src/
└── frontend/
    ├── .specs/features/
    └── src/
```

## Decisões (AD)

| ID     | Decisão | Rationale | Data | Status |
| ------ | ------- | --------- | ---- | ------ |
| AD-001 | Stack: Node.js + React + PostgreSQL | Alinhamento do grupo | 2026-09-11 | active |
| AD-002 | Banco via `docker-compose` | Setup reproduzível | 2026-09-11 | active |
| AD-003 | Abordagem TLC Spec-Driven Development | Requisito da atividade | 2026-09-11 | active |
| AD-004 | Tarifa: R$ 5,00 por hora, mínimo 1 hora | MVP da apresentação | 2026-09-11 | active |
| AD-005 | Placa ABC-1234 ou ABC1D23 | Validação brasileira | 2026-09-11 | active |
| AD-006 | PostgreSQL + DBeaver | Gestão visual; driver `pg` | 2026-09-11 | active |
| AD-007 | Specs por domínio (`backend/.specs`, `frontend/.specs`) | Paralelizar o grupo | 2026-09-11 | active |
| AD-008 | Token de 7 caracteres `[A-Z0-9]` (ex.: `U3T98LX`) | Ticket impresso / login do cliente | 2026-09-24 | active |
| AD-009 | Pagamento simulado via POST | Sem gateway no MVP acadêmico | 2026-09-24 | active |
| AD-010 | Janela de saída de 10 minutos após `pagoEm` | Regra da catraca no enunciado | 2026-09-24 | active |
| AD-011 | Multa de 15% sobre `valorCobrado` se a janela expirar | Enunciado do case | 2026-09-24 | active |
| AD-012 | Impressão e QR são pressuposto; API devolve `token` e `loginUrl` | Fora do escopo de hardware | 2026-09-24 | active |
| AD-013 | Status: `ativo` → `pago` → `finalizado` ou `multa_pendente` | Máquina de estados do ticket | 2026-09-24 | active |

## Features

| Feature | Spec | Status | Responsável |
| ------- | ---- | ------ | ----------- |
| Persistência de Dados | `backend/.specs/features/persistencia-dados/` | Em andamento | João (persist.) |
| Backend API | `backend/.specs/features/backend-api/` | Done | Gustavo |
| Frontend Guarita | `frontend/.specs/features/frontend-guarita/` | Pending | — |

## Handoff

**Última atualização:** 2026-09-24

**Branch:** feat/backend-api

**Concluído:**
- Spec TLC da API (token, pagamento, multa, catraca)
- Schema PostgreSQL com token e estados de pagamento
- API Express: entrada, ticket, pagamento, multa, saída, ativos, histórico, health
- 30 testes de domínio, serviço e HTTP

**Próximo passo:**
- Frontend da guarita e do cliente consumirem os contratos acima
- Recriar volume Docker se o banco ainda tiver o schema antigo (`docker compose down -v`)

**Bloqueios:** nenhum
