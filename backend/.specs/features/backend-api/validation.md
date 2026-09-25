# Backend API — Validation

## Validation

**Result:** PASS

Independent check against `spec.md` after Execute. Tests: 30 passed (`npm test` in `backend/`). Discrimination: mutating `calcularMulta` to return 0 would still fail `regras.test.ts` (`assert.equal(calcularMulta(10), 1.5)`).

## Per-AC evidence

| Req | Spec outcome | Evidence |
| --- | ------------ | -------- |
| API-01 | POST entrada 201 with token fields | `backend/src/app.test.ts:22` `assert.equal(res.status, 201)` |
| API-02 | token 7 alphanumeric | `backend/src/domain/regras.test.ts:32` `assert.match(token, /^[A-Z0-9]{7}$/)` |
| API-03 | loginUrl with FRONTEND_URL | `backend/src/services/registro.service.test.ts:34` loginUrl assertion |
| API-04 | 400 PLACA_INVALIDA | `backend/src/app.test.ts:39` `assert.equal(invalida.body.erro, 'PLACA_INVALIDA')` |
| API-05 | 400 DADOS_INVALIDOS | `backend/src/services/registro.service.test.ts:44` DADOS_INVALIDOS |
| API-06 | 409 PLACA_JA_ATIVA | `backend/src/app.test.ts:43` `assert.equal(dup.body.erro, 'PLACA_JA_ATIVA')` |
| API-07 | plate normalized | `backend/src/domain/regras.test.ts:15` `ABC1234` |
| API-08 | GET ticket 200 | `backend/src/app.test.ts:51` `assert.equal(res.status, 200)` |
| API-09 | 404 TOKEN_INVALIDO | `backend/src/app.test.ts:56` `assert.equal(missing.status, 404)` |
| API-10 | 400 TOKEN_INVALIDO | `backend/src/app.test.ts:54` `assert.equal(bad.status, 400)` |
| API-11 | valorAtual uses tariff | `backend/src/services/registro.service.test.ts:64` `valorAtual === 5` |
| API-12 | payment 200 pago + 10 min | `backend/src/services/registro.service.test.ts:86` janela `11:11:00` |
| API-14 | 409 PAGAMENTO_JA_REALIZADO | `backend/src/services/registro.service.test.ts:96` |
| API-15 | 409 MULTA_PENDENTE on pay | `backend/src/services/registro.service.test.ts:104` |
| API-16 | exit 200 finalizado | `backend/src/services/registro.service.test.ts:123` |
| API-17 | 409 JANELA_SAIDA_EXPIRADA valorMulta 1.50 | `backend/src/services/registro.service.test.ts:139` `extras.valorMulta === 1.5` |
| API-18 | 402 PAGAMENTO_PENDENTE | `backend/src/app.test.ts:84` |
| API-21 | multa payment reopens window | `backend/src/services/registro.service.test.ts:150` |
| API-24 | GET ativos | `backend/src/app.test.ts:95` `ativos.body.length === 1` |
| API-27 | GET historico | `backend/src/app.test.ts:98` |
| Edge 30 min = 5 / 61 min = 10 | `backend/src/domain/regras.test.ts:46` and `:51` |
| Edge health 200/503 | `backend/src/app.test.ts:107` and `:111` |
| Edge 405 | `backend/src/app.test.ts:119` `assert.equal(res.status, 405)` |

## Sensor

Scratch not kept. Obvious mutant `calcularMulta = () => 0` is killed by `regras.test.ts:56`.

## Diff range

Branch `feat/backend-api` from `data-persist`.
