export type StatusRegistro = 'ativo' | 'pago' | 'multa_pendente' | 'finalizado';

export interface Registro {
  id: string;
  placa: string;
  token: string;
  motoristaNome: string;
  modelo: string | null;
  cor: string | null;
  entradaEm: Date;
  saidaEm: Date | null;
  pagoEm: Date | null;
  valorCobrado: number | null;
  valorMulta: number | null;
  multaPagaEm: Date | null;
  status: StatusRegistro;
  criadoEm: Date;
}

export interface DadosEntrada {
  placa: string;
  motoristaNome: string;
  modelo?: string | null;
  cor?: string | null;
  token: string;
  entradaEm: Date;
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

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly extras: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface RegistroRepositoryPort {
  registrarEntrada(dados: DadosEntrada): Promise<Registro>;
  buscarPorToken(token: string): Promise<Registro | null>;
  marcarPago(id: string, valorCobrado: number, pagoEm: Date): Promise<Registro>;
  marcarMultaPendente(id: string, valorMulta: number): Promise<Registro>;
  marcarMultaPaga(id: string, pagoEm: Date): Promise<Registro>;
  finalizarSaida(id: string, saidaEm: Date): Promise<Registro>;
  listarNoPatio(): Promise<Registro[]>;
  historicoPorPlaca(placa: string): Promise<Registro[]>;
}
