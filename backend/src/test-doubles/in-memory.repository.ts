import { randomUUID } from 'node:crypto';
import {
  DadosEntrada,
  Registro,
  RegistroRepositoryPort,
  RepositoryError,
  StatusRegistro,
} from '../types/registro.js';
import { normalizarPlaca, normalizarToken } from '../domain/regras.js';

export class InMemoryRegistroRepository implements RegistroRepositoryPort {
  private registros: Registro[] = [];

  async registrarEntrada(dados: DadosEntrada): Promise<Registro> {
    const placa = normalizarPlaca(dados.placa);
    const noPatio = this.registros.some((r) => r.placa === placa && r.status !== 'finalizado');
    if (noPatio) {
      throw new RepositoryError('PLACA_JA_ATIVA', 'Veículo já está no estacionamento');
    }
    const agora = dados.entradaEm;
    const registro: Registro = {
      id: randomUUID(),
      placa,
      token: normalizarToken(dados.token),
      motoristaNome: dados.motoristaNome.trim(),
      modelo: dados.modelo?.trim() || null,
      cor: dados.cor?.trim() || null,
      entradaEm: agora,
      saidaEm: null,
      pagoEm: null,
      valorCobrado: null,
      valorMulta: null,
      multaPagaEm: null,
      status: 'ativo',
      criadoEm: agora,
    };
    this.registros.push(registro);
    return { ...registro };
  }

  async buscarPorToken(token: string): Promise<Registro | null> {
    const found = this.registros.find((r) => r.token === normalizarToken(token));
    return found ? { ...found } : null;
  }

  async marcarPago(id: string, valorCobrado: number, pagoEm: Date): Promise<Registro> {
    return this.patch(id, { valorCobrado, pagoEm, status: 'pago' });
  }

  async marcarMultaPendente(id: string, valorMulta: number): Promise<Registro> {
    return this.patch(id, { status: 'multa_pendente', valorMulta, pagoEm: null });
  }

  async marcarMultaPaga(id: string, pagoEm: Date): Promise<Registro> {
    return this.patch(id, { multaPagaEm: pagoEm, pagoEm, status: 'pago' });
  }

  async finalizarSaida(id: string, saidaEm: Date): Promise<Registro> {
    return this.patch(id, { saidaEm, status: 'finalizado' });
  }

  async listarNoPatio(): Promise<Registro[]> {
    return this.registros.filter((r) => r.status !== 'finalizado').map((r) => ({ ...r }));
  }

  async historicoPorPlaca(placa: string): Promise<Registro[]> {
    const normalizada = normalizarPlaca(placa);
    return this.registros
      .filter((r) => r.placa === normalizada && r.status === 'finalizado')
      .sort((a, b) => b.entradaEm.getTime() - a.entradaEm.getTime())
      .map((r) => ({ ...r }));
  }

  private patch(id: string, data: Partial<Registro> & { status?: StatusRegistro }): Registro {
    const idx = this.registros.findIndex((r) => r.id === id);
    if (idx < 0) {
      throw new RepositoryError('REGISTRO_NAO_ENCONTRADO', 'Registro não encontrado');
    }
    this.registros[idx] = { ...this.registros[idx], ...data };
    return { ...this.registros[idx] };
  }
}
