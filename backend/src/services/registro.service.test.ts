import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RegistroService } from './registro.service.js';
import { InMemoryRegistroRepository } from '../test-doubles/in-memory.repository.js';
import { AppError } from '../types/registro.js';

function serviceComRelogio() {
  let agora = new Date('2026-09-24T10:00:00.000Z');
  const repo = new InMemoryRegistroRepository();
  const service = new RegistroService(repo, 'http://localhost:5173', () => agora);
  return {
    service,
    avancar(ms: number) {
      agora = new Date(agora.getTime() + ms);
    },
    definir(data: Date) {
      agora = data;
    },
  };
}

describe('RegistroService', () => {
  it('cadastra entrada com token e loginUrl', async () => {
    const { service } = serviceComRelogio();
    const entrada = await service.registrarEntrada({
      placa: 'abc-1234',
      motoristaNome: 'Ana Souza',
      modelo: 'Onix',
      cor: 'Prata',
    });
    assert.equal(entrada.status, 'ativo');
    assert.equal(entrada.placa, 'ABC1234');
    assert.match(entrada.token, /^[A-Z0-9]{7}$/);
    assert.equal(entrada.loginUrl, `http://localhost:5173/?token=${entrada.token}`);
  });

  it('rejeita placa inválida e nome vazio', async () => {
    const { service } = serviceComRelogio();
    await assert.rejects(
      () => service.registrarEntrada({ placa: 'XXXX', motoristaNome: 'Ana' }),
      (err: unknown) => err instanceof AppError && err.code === 'PLACA_INVALIDA' && err.status === 400,
    );
    await assert.rejects(
      () => service.registrarEntrada({ placa: 'ABC1234', motoristaNome: '  ' }),
      (err: unknown) => err instanceof AppError && err.code === 'DADOS_INVALIDOS' && err.status === 400,
    );
  });

  it('rejeita placa já no pátio', async () => {
    const { service } = serviceComRelogio();
    await service.registrarEntrada({ placa: 'ABC1234', motoristaNome: 'Ana' });
    await assert.rejects(
      () => service.registrarEntrada({ placa: 'ABC-1234', motoristaNome: 'Bia' }),
      (err: unknown) => err instanceof AppError && err.code === 'PLACA_JA_ATIVA' && err.status === 409,
    );
  });

  it('login por token calcula valor da estadia ativa', async () => {
    const { service, avancar } = serviceComRelogio();
    const entrada = await service.registrarEntrada({ placa: 'ABC1D23', motoristaNome: 'Ana' });
    avancar(30 * 60 * 1000);
    const ticket = await service.obterTicket(entrada.token);
    assert.equal(ticket.status, 'ativo');
    assert.equal(ticket.valorAtual, 5);
    assert.equal(ticket.duracaoMinutos, 30);
  });

  it('token inexistente ou malformado', async () => {
    const { service } = serviceComRelogio();
    await assert.rejects(
      () => service.obterTicket('ABC12'),
      (err: unknown) => err instanceof AppError && err.status === 400 && err.code === 'TOKEN_INVALIDO',
    );
    await assert.rejects(
      () => service.obterTicket('AAAAAAA'),
      (err: unknown) => err instanceof AppError && err.status === 404 && err.code === 'TOKEN_INVALIDO',
    );
  });

  it('paga estadia e abre janela de 10 minutos', async () => {
    const { service, avancar } = serviceComRelogio();
    const entrada = await service.registrarEntrada({ placa: 'ABC1234', motoristaNome: 'Ana' });
    avancar(61 * 60 * 1000);
    const pagamento = await service.pagar(entrada.token);
    assert.equal(pagamento.status, 'pago');
    assert.equal(pagamento.valorCobrado, 10);
    assert.equal(pagamento.janelaSaidaExpiraEm, '2026-09-24T11:11:00.000Z');
  });

  it('não paga de novo nem paga estadia com multa pendente', async () => {
    const { service, avancar } = serviceComRelogio();
    const entrada = await service.registrarEntrada({ placa: 'ABC1234', motoristaNome: 'Ana' });
    await service.pagar(entrada.token);
    await assert.rejects(
      () => service.pagar(entrada.token),
      (err: unknown) => err instanceof AppError && err.code === 'PAGAMENTO_JA_REALIZADO' && err.status === 409,
    );
    avancar(10 * 60 * 1000);
    await assert.rejects(() => service.registrarSaida(entrada.token), (err: unknown) => {
      return err instanceof AppError && err.code === 'JANELA_SAIDA_EXPIRADA';
    });
    await assert.rejects(
      () => service.pagar(entrada.token),
      (err: unknown) => err instanceof AppError && err.code === 'MULTA_PENDENTE' && err.status === 409,
    );
  });

  it('saída sem pagamento retorna 402', async () => {
    const { service } = serviceComRelogio();
    const entrada = await service.registrarEntrada({ placa: 'ABC1234', motoristaNome: 'Ana' });
    await assert.rejects(
      () => service.registrarSaida(entrada.token),
      (err: unknown) => err instanceof AppError && err.status === 402 && err.code === 'PAGAMENTO_PENDENTE',
    );
  });

  it('saída dentro da janela finaliza', async () => {
    const { service, avancar } = serviceComRelogio();
    const entrada = await service.registrarEntrada({ placa: 'ABC1234', motoristaNome: 'Ana' });
    await service.pagar(entrada.token);
    avancar(9 * 60 * 1000);
    const saida = await service.registrarSaida(entrada.token);
    assert.equal(saida.status, 'finalizado');
    assert.equal(saida.valorCobrado, 5);
  });

  it('saída após 10 minutos gera multa de 15%', async () => {
    const { service, avancar } = serviceComRelogio();
    const entrada = await service.registrarEntrada({ placa: 'ABC1234', motoristaNome: 'Ana' });
    avancar(61 * 60 * 1000);
    await service.pagar(entrada.token);
    avancar(10 * 60 * 1000);
    await assert.rejects(
      () => service.registrarSaida(entrada.token),
      (err: unknown) =>
        err instanceof AppError &&
        err.status === 409 &&
        err.code === 'JANELA_SAIDA_EXPIRADA' &&
        err.extras.valorMulta === 1.5,
    );
  });

  it('pagamento da multa reabre janela e permite saída', async () => {
    const { service, avancar } = serviceComRelogio();
    const entrada = await service.registrarEntrada({ placa: 'ABC1234', motoristaNome: 'Ana' });
    await service.pagar(entrada.token);
    avancar(10 * 60 * 1000);
    await assert.rejects(() => service.registrarSaida(entrada.token));
    const multa = await service.pagarMulta(entrada.token);
    assert.equal(multa.status, 'pago');
    assert.equal(multa.valorMulta, 0.75);
    const saida = await service.registrarSaida(entrada.token);
    assert.equal(saida.status, 'finalizado');
  });

  it('lista ativos e histórico', async () => {
    const { service } = serviceComRelogio();
    const a = await service.registrarEntrada({ placa: 'ABC1234', motoristaNome: 'Ana' });
    await service.registrarEntrada({ placa: 'XYZ9876', motoristaNome: 'Bia' });
    await service.pagar(a.token);
    await service.registrarSaida(a.token);
    const ativos = await service.listarAtivos();
    assert.equal(ativos.length, 1);
    assert.equal(ativos[0].placa, 'XYZ9876');
    const historico = await service.historico('ABC-1234');
    assert.equal(historico.length, 1);
    assert.equal(historico[0].status, 'finalizado');
  });
});
