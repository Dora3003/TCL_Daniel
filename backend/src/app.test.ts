import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from './app.js';
import { RegistroService } from './services/registro.service.js';
import { InMemoryRegistroRepository } from './test-doubles/in-memory.repository.js';

function montar(dbUp = true) {
  let agora = new Date('2026-09-24T10:00:00.000Z');
  const repo = new InMemoryRegistroRepository();
  const service = new RegistroService(repo, 'http://localhost:5173', () => agora);
  const app = createApp(service, async () => dbUp);
  return {
    app,
    avancar(ms: number) {
      agora = new Date(agora.getTime() + ms);
    },
  };
}

describe('HTTP API', () => {
  it('POST /api/entrada cria ticket', async () => {
    const { app } = montar();
    const res = await request(app).post('/api/entrada').send({
      placa: 'ABC-1234',
      motoristaNome: 'Ana Souza',
      modelo: 'Onix',
      cor: 'Prata',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, 'ativo');
    assert.match(res.body.token, /^[A-Z0-9]{7}$/);
    assert.ok(String(res.body.loginUrl).includes(res.body.token));
  });

  it('POST /api/entrada valida placa e duplicidade', async () => {
    const { app } = montar();
    const invalida = await request(app).post('/api/entrada').send({ placa: 'XX', motoristaNome: 'Ana' });
    assert.equal(invalida.status, 400);
    assert.equal(invalida.body.erro, 'PLACA_INVALIDA');
    await request(app).post('/api/entrada').send({ placa: 'ABC1234', motoristaNome: 'Ana' });
    const dup = await request(app).post('/api/entrada').send({ placa: 'ABC1234', motoristaNome: 'Ana' });
    assert.equal(dup.status, 409);
    assert.equal(dup.body.erro, 'PLACA_JA_ATIVA');
  });

  it('GET /api/tickets/:token faz login', async () => {
    const { app } = montar();
    const created = await request(app).post('/api/entrada').send({ placa: 'ABC1234', motoristaNome: 'Ana' });
    const res = await request(app).get(`/api/tickets/${created.body.token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ativo');
    assert.equal(res.body.valorAtual, 5);
    const bad = await request(app).get('/api/tickets/ABC');
    assert.equal(bad.status, 400);
    const missing = await request(app).get('/api/tickets/AAAAAAA');
    assert.equal(missing.status, 404);
  });

  it('pagamento, saída no prazo e multa', async () => {
    const { app, avancar } = montar();
    const created = await request(app).post('/api/entrada').send({ placa: 'ABC1234', motoristaNome: 'Ana' });
    const token = created.body.token;
    avancar(61 * 60 * 1000);
    const pagamento = await request(app).post(`/api/tickets/${token}/pagamentos`);
    assert.equal(pagamento.status, 200);
    assert.equal(pagamento.body.valorCobrado, 10);
    avancar(10 * 60 * 1000);
    const expirada = await request(app).post('/api/saida').send({ token });
    assert.equal(expirada.status, 409);
    assert.equal(expirada.body.erro, 'JANELA_SAIDA_EXPIRADA');
    assert.equal(expirada.body.valorMulta, 1.5);
    const multa = await request(app).post(`/api/tickets/${token}/multas`);
    assert.equal(multa.status, 200);
    const saida = await request(app).post('/api/saida').send({ token });
    assert.equal(saida.status, 200);
    assert.equal(saida.body.status, 'finalizado');
  });

  it('saída sem pagamento é 402', async () => {
    const { app } = montar();
    const created = await request(app).post('/api/entrada').send({ placa: 'ABC1234', motoristaNome: 'Ana' });
    const res = await request(app).post('/api/saida').send({ token: created.body.token });
    assert.equal(res.status, 402);
    assert.equal(res.body.erro, 'PAGAMENTO_PENDENTE');
  });

  it('lista ativos e histórico', async () => {
    const { app } = montar();
    const a = await request(app).post('/api/entrada').send({ placa: 'ABC1234', motoristaNome: 'Ana' });
    await request(app).post('/api/entrada').send({ placa: 'XYZ9876', motoristaNome: 'Bia' });
    await request(app).post(`/api/tickets/${a.body.token}/pagamentos`);
    await request(app).post('/api/saida').send({ token: a.body.token });
    const ativos = await request(app).get('/api/ativos');
    assert.equal(ativos.status, 200);
    assert.equal(ativos.body.length, 1);
    const historico = await request(app).get('/api/historico/ABC-1234');
    assert.equal(historico.status, 200);
    assert.equal(historico.body.length, 1);
    const placaRuim = await request(app).get('/api/historico/XXX');
    assert.equal(placaRuim.status, 400);
  });

  it('health e JSON inválido', async () => {
    const up = montar(true);
    const ok = await request(up.app).get('/api/health');
    assert.equal(ok.status, 200);
    assert.equal(ok.body.db, 'connected');
    const down = montar(false);
    const fail = await request(down.app).get('/api/health');
    assert.equal(fail.status, 503);
    const bad = await request(up.app).post('/api/entrada').set('Content-Type', 'application/json').send('{');
    assert.equal(bad.status, 400);
    assert.equal(bad.body.erro, 'REQUISICAO_INVALIDA');
  });

  it('método não suportado retorna 405', async () => {
    const { app } = montar();
    const res = await request(app).put('/api/entrada');
    assert.equal(res.status, 405);
  });
});
