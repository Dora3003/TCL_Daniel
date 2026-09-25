import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularMulta,
  calcularValor,
  gerarToken,
  janelaSaidaExpirada,
  normalizarPlaca,
  validarPlaca,
  validarToken,
} from './regras.js';

describe('placa', () => {
  it('normaliza maiúsculas, espaços e hífen', () => {
    assert.equal(normalizarPlaca(' abc-1234 '), 'ABC1234');
  });

  it('aceita formato antigo e Mercosul', () => {
    assert.equal(validarPlaca('ABC-1234'), true);
    assert.equal(validarPlaca('ABC1D23'), true);
  });

  it('rejeita placa inválida', () => {
    assert.equal(validarPlaca('ABCD123'), false);
    assert.equal(validarPlaca(''), false);
  });
});

describe('token', () => {
  it('gera 7 caracteres A-Z0-9', () => {
    const token = gerarToken();
    assert.match(token, /^[A-Z0-9]{7}$/);
    assert.equal(validarToken(token), true);
  });

  it('rejeita token fora do formato', () => {
    assert.equal(validarToken('U3T98L'), false);
    assert.equal(validarToken('u3t98lx'), true);
  });
});

describe('tarifa e multa', () => {
  const entrada = new Date('2026-09-24T10:00:00.000Z');

  it('cobra 5.00 em 30 minutos', () => {
    const saida = new Date('2026-09-24T10:30:00.000Z');
    assert.equal(calcularValor(entrada, saida), 5);
  });

  it('cobra 10.00 em 61 minutos', () => {
    const saida = new Date('2026-09-24T11:01:00.000Z');
    assert.equal(calcularValor(entrada, saida), 10);
  });

  it('aplica 15% com duas casas', () => {
    assert.equal(calcularMulta(10), 1.5);
  });
});

describe('janela de saída', () => {
  const pagoEm = new Date('2026-09-24T12:00:00.000Z');

  it('permanece válida antes de 10 minutos', () => {
    const agora = new Date('2026-09-24T12:09:59.000Z');
    assert.equal(janelaSaidaExpirada(pagoEm, agora), false);
  });

  it('expira em 10 minutos inclusive', () => {
    const agora = new Date('2026-09-24T12:10:00.000Z');
    assert.equal(janelaSaidaExpirada(pagoEm, agora), true);
  });
});
