# TCL_Daniel — Estacionamento Guarita

Trabalho de Inovação e Tecnologia — Spec-Driven Development (TLC).

## Estrutura

```
/
├── docker-compose.yml
├── database/          # Schema SQL + guia DBeaver
├── .specs/STATE.md    # Decisões globais do grupo
├── backend/           # Express + TypeScript
└── frontend/          # React + spec da interface
```

## Setup

```bash
cp .env.example .env
docker compose up -d
cd backend
npm install
npm run dev
```

API em `http://localhost:3000`. Swagger em `http://localhost:3000/api/docs`. Specs TLC em `backend/.specs/features/backend-api/`.

Se o banco já existia com o schema antigo:

```bash
docker compose down -v
docker compose up -d
```

## Endpoints

| Método | Rota | Quem usa |
| ------ | ---- | -------- |
| POST | `/api/entrada` | Guarita |
| GET | `/api/ativos` | Guarita |
| GET | `/api/historico/:placa` | Guarita |
| GET | `/api/tickets/:token` | Cliente (login) |
| POST | `/api/tickets/:token/pagamentos` | Cliente |
| POST | `/api/tickets/:token/multas` | Cliente |
| POST | `/api/saida` | Catraca |
| GET | `/api/health` | Operação |
| GET | `/api/docs` | Swagger UI |
| GET | `/api/openapi.json` | Spec OpenAPI |

Impressão do ticket e QR são pressuposto: o cadastro devolve `token` e `loginUrl`.

## Deploy no Vercel

O Vercel sobe o backend como container a partir de `backend/Dockerfile.vercel` (`vercel.json` na raiz). O Postgres **não** vai no Vercel: use um banco hospedado (Neon, Supabase, Railway) e configure:

- `DATABASE_URL`
- `FRONTEND_URL`
- `CORS_ORIGIN` (pode ser `*`)

```bash
npx vercel login
npx vercel --prod
```

Local com API em container:

```bash
docker compose up --build
```

Conexão DBeaver: `database/README.md`.
