# Backend API — Design

## Arquitetura em camadas

```
┌──────────────────────────────────────────────┐
│  Routes (Express)                            │
│  POST /api/entrada  POST /api/saida          │
│  GET  /api/ativos   GET /api/historico/:placa│
│  GET  /api/health                            │
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────▼───────────────────────────┐
│  Controllers                                 │
│  entradaController  saidaController          │
│  consultaController                          │
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────▼───────────────────────────┐
│  Services                                    │
│  RegistroService (regras de negócio)         │
│  TarifaService (cálculo de valor)            │
│  PlacaValidator                              │
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────▼───────────────────────────┐
│  RegistroRepository (persistência)           │
└──────────────────────────────────────────────┘
```

## Endpoints

| Método | Rota                    | Descrição              | Status sucesso |
| ------ | ----------------------- | ---------------------- | -------------- |
| POST   | `/api/entrada`          | Registrar entrada      | 201            |
| POST   | `/api/saida`            | Registrar saída + valor| 200            |
| GET    | `/api/ativos`           | Veículos no pátio      | 200            |
| GET    | `/api/historico/:placa` | Histórico da placa     | 200            |
| GET    | `/api/health`           | Health check           | 200            |

## Contratos de resposta

### POST /api/entrada — 201

```json
{
  "id": "uuid",
  "placa": "ABC-1234",
  "entradaEm": "2026-09-11T13:00:00.000Z",
  "status": "ativo"
}
```

### POST /api/saida — 200

```json
{
  "id": "uuid",
  "placa": "ABC-1234",
  "entradaEm": "2026-09-11T13:00:00.000Z",
  "saidaEm": "2026-09-11T14:30:00.000Z",
  "duracaoMinutos": 90,
  "valorCobrado": 10.00,
  "status": "finalizado"
}
```

### Erro padrão — 4xx/5xx

```json
{
  "erro": "CODIGO_ERRO",
  "mensagem": "Descrição legível para o operador"
}
```

## Cálculo de tarifa (TarifaService)

```typescript
const TARIFA_POR_HORA = 5.00;
const MINIMO_HORAS = 1;

function calcularValor(entradaEm: Date, saidaEm: Date): number {
  const diffMs = saidaEm.getTime() - entradaEm.getTime();
  const horas = Math.ceil(diffMs / (1000 * 60 * 60));
  const horasCobradas = Math.max(horas, MINIMO_HORAS);
  return horasCobradas * TARIFA_POR_HORA;
}
```

## Validação de placa

```typescript
const PLACA_ANTIGA = /^[A-Z]{3}-?\d{4}$/;
const PLACA_MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/;

function normalizarPlaca(placa: string): string {
  return placa.trim().toUpperCase().replace(/\s/g, '');
}

function validarPlaca(placa: string): boolean {
  const normalizada = normalizarPlaca(placa);
  return PLACA_ANTIGA.test(normalizada) || PLACA_MERCOSUL.test(normalizada);
}
```

## Estrutura de arquivos

```
backend/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── routes/
│   │   └── registro.routes.ts
│   ├── controllers/
│   │   └── registro.controller.ts
│   ├── services/
│   │   ├── registro.service.ts
│   │   └── tarifa.service.ts
│   ├── validators/
│   │   └── placa.validator.ts
│   ├── repositories/
│   │   └── registro.repository.ts
│   └── middlewares/
│       ├── error.middleware.ts
│       └── logger.middleware.ts
```

Schema do banco definido em `database/init.sql` na raiz do repositório (ver `database/README.md` para DBeaver).

## Dependências previstas

| Pacote        | Uso                    |
| ------------- | ---------------------- |
| express       | Servidor HTTP          |
| pg            | Driver PostgreSQL      |
| cors          | CORS para React dev    |
| zod           | Validação de request   |
| typescript    | Tipagem                |
| vitest        | Testes unitários       |
