import type { Pool, QueryResultRow } from 'pg';
import { pool } from '../db/pool.js';
import {
  DadosEntrada,
  Registro,
  RegistroRepositoryPort,
  RepositoryError,
  StatusRegistro,
} from '../types/registro.js';
import { normalizarPlaca, normalizarToken } from '../domain/regras.js';

interface RegistroRow extends QueryResultRow {
  id: string;
  placa: string;
  token: string;
  motorista_nome: string;
  modelo: string | null;
  cor: string | null;
  entrada_em: Date;
  saida_em: Date | null;
  pago_em: Date | null;
  valor_cobrado: string | null;
  valor_multa: string | null;
  multa_paga_em: Date | null;
  status: StatusRegistro;
  criado_em: Date;
}

function mapRow(row: RegistroRow): Registro {
  return {
    id: row.id,
    placa: row.placa,
    token: row.token,
    motoristaNome: row.motorista_nome,
    modelo: row.modelo,
    cor: row.cor,
    entradaEm: row.entrada_em,
    saidaEm: row.saida_em,
    pagoEm: row.pago_em,
    valorCobrado: row.valor_cobrado !== null ? Number(row.valor_cobrado) : null,
    valorMulta: row.valor_multa !== null ? Number(row.valor_multa) : null,
    multaPagaEm: row.multa_paga_em,
    status: row.status,
    criadoEm: row.criado_em,
  };
}

function handleDbError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === '23505') {
      const constraint = 'constraint' in error ? String(error.constraint) : '';
      if (constraint.includes('placa')) {
        throw new RepositoryError('PLACA_JA_ATIVA', 'Veículo já está no estacionamento');
      }
      throw new RepositoryError('ERRO_BANCO', 'Erro ao acessar o banco de dados');
    }
  }

  throw new RepositoryError('ERRO_BANCO', 'Erro ao acessar o banco de dados');
}

export class RegistroRepository implements RegistroRepositoryPort {
  constructor(private readonly db: Pool = pool) {}

  async registrarEntrada(dados: DadosEntrada): Promise<Registro> {
    try {
      const result = await this.db.query<RegistroRow>(
        `INSERT INTO registros_estacionamento
           (placa, token, motorista_nome, modelo, cor, entrada_em, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'ativo')
         RETURNING *`,
        [
          normalizarPlaca(dados.placa),
          normalizarToken(dados.token),
          dados.motoristaNome.trim(),
          dados.modelo?.trim() || null,
          dados.cor?.trim() || null,
          dados.entradaEm,
        ],
      );

      return mapRow(result.rows[0]);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      handleDbError(error);
    }
  }

  async buscarPorToken(token: string): Promise<Registro | null> {
    const result = await this.db.query<RegistroRow>(
      `SELECT * FROM registros_estacionamento WHERE token = $1 LIMIT 1`,
      [normalizarToken(token)],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async marcarPago(id: string, valorCobrado: number, pagoEm: Date): Promise<Registro> {
    const result = await this.db.query<RegistroRow>(
      `UPDATE registros_estacionamento
       SET valor_cobrado = $2, pago_em = $3, status = 'pago'
       WHERE id = $1
       RETURNING *`,
      [id, valorCobrado, pagoEm],
    );
    if (!result.rows[0]) {
      throw new RepositoryError('REGISTRO_NAO_ENCONTRADO', 'Registro não encontrado');
    }
    return mapRow(result.rows[0]);
  }

  async marcarMultaPendente(id: string, valorMulta: number): Promise<Registro> {
    const result = await this.db.query<RegistroRow>(
      `UPDATE registros_estacionamento
       SET status = 'multa_pendente', valor_multa = $2, pago_em = NULL
       WHERE id = $1
       RETURNING *`,
      [id, valorMulta],
    );
    if (!result.rows[0]) {
      throw new RepositoryError('REGISTRO_NAO_ENCONTRADO', 'Registro não encontrado');
    }
    return mapRow(result.rows[0]);
  }

  async marcarMultaPaga(id: string, pagoEm: Date): Promise<Registro> {
    const result = await this.db.query<RegistroRow>(
      `UPDATE registros_estacionamento
       SET multa_paga_em = $2, pago_em = $2, status = 'pago'
       WHERE id = $1
       RETURNING *`,
      [id, pagoEm],
    );
    if (!result.rows[0]) {
      throw new RepositoryError('REGISTRO_NAO_ENCONTRADO', 'Registro não encontrado');
    }
    return mapRow(result.rows[0]);
  }

  async finalizarSaida(id: string, saidaEm: Date): Promise<Registro> {
    const result = await this.db.query<RegistroRow>(
      `UPDATE registros_estacionamento
       SET saida_em = $2, status = 'finalizado'
       WHERE id = $1
       RETURNING *`,
      [id, saidaEm],
    );
    if (!result.rows[0]) {
      throw new RepositoryError('REGISTRO_NAO_ENCONTRADO', 'Registro não encontrado');
    }
    return mapRow(result.rows[0]);
  }

  async listarNoPatio(): Promise<Registro[]> {
    const result = await this.db.query<RegistroRow>(
      `SELECT * FROM registros_estacionamento
       WHERE status <> 'finalizado'
       ORDER BY entrada_em ASC`,
    );
    return result.rows.map(mapRow);
  }

  async historicoPorPlaca(placa: string): Promise<Registro[]> {
    const result = await this.db.query<RegistroRow>(
      `SELECT * FROM registros_estacionamento
       WHERE placa = $1 AND status = 'finalizado'
       ORDER BY entrada_em DESC`,
      [normalizarPlaca(placa)],
    );
    return result.rows.map(mapRow);
  }
}
