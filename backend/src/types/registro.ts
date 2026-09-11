export type StatusRegistro = 'ativo' | 'finalizado';

export interface Registro {
  id: string;
  placa: string;
  entradaEm: Date;
  saidaEm: Date | null;
  valorCobrado: number | null;
  status: StatusRegistro;
  criadoEm: Date;
}

export class RepositoryError extends Error {
  constructor(
    public readonly code: 'PLACA_JA_ATIVA' | 'REGISTRO_NAO_ENCONTRADO' | 'ERRO_BANCO',
    message: string,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
