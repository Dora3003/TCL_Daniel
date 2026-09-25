# Backend API — Tasks

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: none - strong defaults applied. No test files existed; Vitest is introduced as the runner.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domain | unit | 1:1 to tariff, plate, token, window and fine ACs | `backend/src/domain/*.test.ts` | `npm test` |
| Service | unit | All state transitions and error codes from spec | `backend/src/services/*.test.ts` | `npm test` |
| HTTP | unit | Happy path + documented errors per route | `backend/src/app.test.ts` | `npm test` |
| Repository / schema | none | Build gate only (SQL + types) | - | build gate |
| Config | none | Build gate only | - | build gate |

## Gate Check Commands

> Generated from `backend/package.json` (scripts added during Execute).

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Unit-test tasks | `npm test` (cwd `backend`) |
| Full | HTTP tests | `npm test` (cwd `backend`) |
| Build | Schema/config or phase end | `npm test && npm run build` (cwd `backend`) |

---

## Task Breakdown

| ID | Deliverable | Layer | Tests |
| -- | ----------- | ----- | ----- |
| T1 | Domain rules | Domain | unit |
| T2 | SQL schema | Schema | none |
| T3 | Repository lifecycle | Repository | none |
| T4 | RegistroService | Service | unit |
| T5 | Express REST | HTTP | unit |

Full definitions live in the Execution Plan so each task has a single header.

---

## Execution Plan

```
Phase 1 (foundation) → Phase 2 (repository) → Phase 3 (service) → Phase 4 (http)
```

### Phase 1: Foundation

Independent domain rules and SQL. No intra-phase dependency.

```
T1
T2
```

### T1: Domain rules for plate, token, tariff and fine

**What**: Implement `normalizarPlaca`, `validarPlaca`, `gerarToken`, `validarToken`, `calcularValor`, `calcularMulta` and `janelaSaidaExpirada`.
**Where**: `backend/src/domain/regras.ts`
**Depends on**: none
**Reqs**: API-02, API-07, API-11, API-16, API-17
**Done when**: 30 min = 5.00; 61 min = 10.00; multa of 10.00 = 1.50; token is 7 `[A-Z0-9]`; window expires at exactly 10 minutes.
**Tests**: unit in `backend/src/domain/regras.test.ts`
**Gate**: Quick

### T2: Parking schema with token and payment states

**What**: Recreate SQL for token, driver, car fields and statuses `pago` / `multa_pendente`.
**Where**: `database/init.sql`
**Depends on**: none
**Reqs**: API-01, API-06, API-26
**Done when**: `init.sql` and `schema.sql` define unique token, unique in-parking plate and the four statuses.
**Tests**: none
**Gate**: Build

### Phase 2: Persistence

```
T1 -> T3
T2 -> T3
```

### T3: Repository methods for ticket lifecycle

**What**: Persist entry, lookup by token, pay, fine, exit and list in-parking records.
**Where**: `backend/src/repositories/registro.repository.ts`
**Depends on**: T1, T2
**Reqs**: API-01, API-06, API-08, API-12, API-16, API-21, API-24
**Done when**: Types include the new fields and repository methods match the design interfaces.
**Tests**: none
**Gate**: Build

### Phase 3: Application service

```
T3 -> T4
```

### T4: RegistroService state machine

**What**: Orchestrate entry, ticket view, payment, exit window, fine and listing with injectable clock.
**Where**: `backend/src/services/registro.service.ts`
**Depends on**: T3
**Reqs**: API-01 to API-26
**Done when**: Service tests cover success objects and every documented error code without HTTP.
**Tests**: unit in `backend/src/services/registro.service.test.ts` with an in-memory repository
**Gate**: Quick

### Phase 4: HTTP

```
T4 -> T5
```

### T5: Express REST API

**What**: Wire routes, Zod bodies, error middleware and health check.
**Where**: `backend/src/app.ts`
**Depends on**: T4
**Reqs**: API-01 to API-29
**Done when**: HTTP tests hit every route happy path and each documented error status.
**Tests**: unit/http in `backend/src/app.test.ts`
**Gate**: Full
