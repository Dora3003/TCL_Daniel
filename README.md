# TCL_Daniel — Estacionamento Guarita

Trabalho de Inovação e Tecnologia — Spec-Driven Development (TLC).

## Estrutura

```
/
├── docker-compose.yml
├── database/          # Schema SQL + guia DBeaver
├── .specs/STATE.md    # Decisões globais do grupo
├── backend/           # Node.js + specs de persistência e API
└── frontend/          # React + spec da interface
```

## Setup rápido

```bash
cp .env.example .env
docker compose up -d
```

Conexão DBeaver: ver `database/README.md`.
