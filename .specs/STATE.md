# Estado do Projeto — Estacionamento Guarita

## Visão Geral

Sistema de controle de estacionamento para operação na guarita: registrar entrada e saída de veículos, calcular tempo de permanência e valor cobrado.

| Camada       | Tecnologia                      |
| ------------ | ------------------------------- |
| Frontend     | React + HTML/CSS                |
| Backend      | Node.js                         |
| Persistência | PostgreSQL + Docker + DBeaver   |

## Estrutura do Repositório

```
/
├── docker-compose.yml       # Infra compartilhada
├── .env.example
├── database/                # SQL + guia DBeaver
├── .specs/STATE.md          # Decisões globais do grupo (este arquivo)
├── backend/
│   ├── .specs/features/     # Specs de persistência e API
│   └── src/                 # Código Node.js
└── frontend/
    ├── .specs/features/     # Spec da interface da guarita
    └── src/                 # Código React (a criar)
```

## Decisões (AD)

| ID     | Decisão                                           | Rationale                                                              | Data       |
| ------ | ------------------------------------------------- | ---------------------------------------------------------------------- | ---------- |
| AD-001 | Stack: Node.js + React + PostgreSQL               | Alinhamento do grupo; ecossistema maduro e documentado                 | 2026-09-11 |
| AD-002 | Banco via `docker-compose` no repositório         | Setup reproduzível com `git clone` + `docker compose up`               | 2026-09-11 |
| AD-003 | Abordagem TLC Spec-Driven Development             | Requisito da atividade (tópico 4)                                      | 2026-09-11 |
| AD-004 | Tarifa: R$ 5,00 por hora, mínimo 1 hora           | Regra de negócio simples para MVP da apresentação                      | 2026-09-11 |
| AD-005 | Formato de placa: ABC-1234 ou ABC1D23 (Mercosul)  | Validação brasileira comum em estacionamentos                          | 2026-09-11 |
| AD-006 | PostgreSQL + DBeaver para persistência            | Banco relacional com gestão visual via DBeaver; driver `pg` no Node.js | 2026-09-11 |
| AD-007 | Specs por domínio (`backend/.specs`, `frontend/.specs`) | Paralelizar trabalho do grupo e reduzir conflitos de merge        | 2026-09-11 |

## Features

| Feature               | Spec                                                        | Status       | Responsável      |
| --------------------- | ----------------------------------------------------------- | ------------ | ---------------- |
| Persistência de Dados | `backend/.specs/features/persistencia-dados/`               | Em andamento | João (persist.)  |
| Backend API           | `backend/.specs/features/backend-api/`                      | Pending      | —                |
| Frontend Guarita      | `frontend/.specs/features/frontend-guarita/`                | Pending      | —                |

## Handoff

**Última atualização:** 2026-09-11

**Branch:** main

**Concluído:**
- Estrutura de specs por domínio (`backend/.specs`, `frontend/.specs`)
- `docker-compose.yml` + schema SQL PostgreSQL
- `RegistroRepository` com driver `pg`
- Guia de conexão DBeaver em `database/README.md`

**Próximo passo:**
- Integrar repositório com a API Express (feature backend)
- Iniciar implementação do frontend React

**Bloqueios:** nenhum
