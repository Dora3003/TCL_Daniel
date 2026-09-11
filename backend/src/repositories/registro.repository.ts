import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { pool } from '../db/pool.js';
import { Registro, RepositoryError } from '../types/registro.js';

interface RegistroRow extends QueryResultRow {
  id: string;
  placa: string;
  entrada_em: Date;
  saida_em: Date | null;
  valor_cobrado: string | null;
  status: 'ativo' | 'finalizado';
  criado_em: Date;
}

function mapRow(row: RegistroRow): Registro {
  return {
    id: row.id,
    placa: row.placa,
    entradaEm: row.entrada_em,
    saidaEm: row.saida_em,
    valorCobrado: row.valor_cobrado !== null ? Number(row.valor_cobrado) : null,
    status: row.status,
    criadoEm: row.criado_em,
  };
}

function normalizarPlaca(placa: string): string {
  return placa.trim().toUpperCase().replace(/[\s-]/g, '');
}

function handleDbError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === '23505') {
      throw new RepositoryError('PLACA_JA_ATIVA', 'Veículo já está no estacionamento');
    }
  }

  throw new RepositoryError('ERRO_BANCO', 'Erro ao acessar o banco de dados');
}

export class RegistroRepository {
  constructor(private readonly db: Pool = pool) {}

  async registrarEntrada(placa: string): Promise<Registro> {
    const placaNormalizada = normalizarPlaca(placa);

    try {
      const result = await this.db.query<RegistroRow>(
        `INSERT INTO registros_estacionamento (placa, entrada_em, status)
         VALUES ($1, NOW(), 'ativo')
         RETURNING *`,
        [placaNormalizada],
      );

      return mapRow(result.rows[0]);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      handleDbError(error);
    }
  }

  async registrarSaida(placa: string, valorCobrado: number): Promise<Registro> {
    const placaNormalizada = normalizarPlaca(placa);
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const ativo = await client.query<RegistroRow>(
        `SELECT * FROM registros_estacionamento
         WHERE placa = $1 AND status = 'ativo'
         LIMIT 1`,
        [placaNormalizada],
      );

      if (ativo.rows.length === 0) {
        throw new RepositoryError('REGISTRO_NAO_ENCONTRADO', 'Nenhum veículo ativo encontrado para esta placa');
      }

      const result = await client.query<RegistroRow>(
        `UPDATE registros_estacionamento
         SET saida_em = NOW(),
             valor_cobrado = $2,
             status = 'finalizado'
         WHERE id = $1
         RETURNING *`,
        [ativo.rows[0].id, valorCobrado],
      );

      await client.query('COMMIT');
      return mapRow(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof RepositoryError) throw error;
      handleDbError(error);
    } finally {
      client.release();
    }
  }

  async buscarAtivoPorPlaca(placa: string): Promise<Registro | null> {
    const placaNormalizada = normalizarPlaca(placa);

    const result = await this.db.query<RegistroRow>(
      `SELECT * FROM registros_estacionamento
       WHERE placa = $1 AND status = 'ativo'
       LIMIT 1`,
      [placaNormalizada],
    );

    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async listarAtivos(): Promise<Registro[]> {
    const result = await this.db.query<RegistroRow>(
      `SELECT * FROM registros_estacionamento
       WHERE status = 'ativo'
       ORDER BY entrada_em ASC`,
    );

    return result.rows.map(mapRow);
  }

  async historicoPorPlaca(placa: string): Promise<Registro[]> {
    const placaNormalizada = normalizarPlaca(placa);

    const result = await this.db.query<RegistroRow>(
      `SELECT * FROM registros_estacionamento
       WHERE placa = $1 AND status = 'finalizado'
       ORDER BY entrada_em DESC`,
      [placaNormalizada],
    );

    return result.rows.map(mapRow);
  }
}
