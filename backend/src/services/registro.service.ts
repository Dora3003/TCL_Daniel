import {
  calcularMulta,
  calcularValor,
  expiracaoJanela,
  gerarToken,
  janelaSaidaExpirada,
  minutosEntre,
  normalizarPlaca,
  validarPlaca,
  validarToken,
} from '../domain/regras.js';
import { AppError, Registro, RegistroRepositoryPort } from '../types/registro.js';
import { RepositoryError } from '../types/registro.js';

function noPatio(status: Registro['status']): boolean {
  return status === 'ativo' || status === 'pago' || status === 'multa_pendente';
}

export class RegistroService {
  constructor(
    private readonly repo: RegistroRepositoryPort,
    private readonly frontendUrl: string,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  private loginUrl(token: string): string {
    const base = this.frontendUrl.replace(/\/$/, '');
    return `${base}/?token=${token}`;
  }

  private async gerarTokenUnico(): Promise<string> {
    for (let i = 0; i < 8; i += 1) {
      const token = gerarToken();
      const existente = await this.repo.buscarPorToken(token);
      if (!existente) return token;
    }
    throw new AppError(500, 'ERRO_INTERNO', 'Não foi possível gerar token único');
  }

  async registrarEntrada(input: {
    placa?: unknown;
    motoristaNome?: unknown;
    modelo?: unknown;
    cor?: unknown;
  }) {
    if (typeof input.placa !== 'string') {
      throw new AppError(400, 'REQUISICAO_INVALIDA', 'Campo placa é obrigatório');
    }
    if (typeof input.motoristaNome !== 'string' || input.motoristaNome.trim() === '') {
      throw new AppError(400, 'DADOS_INVALIDOS', 'Nome do motorista é obrigatório');
    }
    if (!validarPlaca(input.placa)) {
      throw new AppError(400, 'PLACA_INVALIDA', 'Placa inválida');
    }

    const modelo = typeof input.modelo === 'string' ? input.modelo : null;
    const cor = typeof input.cor === 'string' ? input.cor : null;
    const token = await this.gerarTokenUnico();
    const entradaEm = this.clock();

    try {
      const registro = await this.repo.registrarEntrada({
        placa: input.placa,
        motoristaNome: input.motoristaNome,
        modelo,
        cor,
        token,
        entradaEm,
      });

      return {
        id: registro.id,
        placa: registro.placa,
        motoristaNome: registro.motoristaNome,
        modelo: registro.modelo,
        cor: registro.cor,
        token: registro.token,
        loginUrl: this.loginUrl(registro.token),
        entradaEm: registro.entradaEm.toISOString(),
        status: registro.status,
      };
    } catch (error) {
      this.rethrow(error);
    }
  }

  async obterTicket(token: string) {
    try {
      const registro = await this.ticketNoPatio(token);
      const agora = this.clock();
      const valorAtual =
        registro.status === 'ativo'
          ? calcularValor(registro.entradaEm, agora)
          : registro.valorCobrado ?? calcularValor(registro.entradaEm, agora);

      return {
        placa: registro.placa,
        motoristaNome: registro.motoristaNome,
        entradaEm: registro.entradaEm.toISOString(),
        status: registro.status,
        duracaoMinutos: minutosEntre(registro.entradaEm, agora),
        valorAtual,
        valorMulta: registro.valorMulta,
        janelaSaidaExpiraEm: registro.pagoEm ? expiracaoJanela(registro.pagoEm).toISOString() : null,
      };
    } catch (error) {
      this.rethrow(error);
    }
  }

  async pagar(token: string) {
    try {
      const registro = await this.ticketNoPatio(token);
      if (registro.status === 'pago') {
        throw new AppError(409, 'PAGAMENTO_JA_REALIZADO', 'Pagamento já realizado');
      }
      if (registro.status === 'multa_pendente') {
        throw new AppError(409, 'MULTA_PENDENTE', 'Há multa pendente');
      }

      const agora = this.clock();
      const valorCobrado = calcularValor(registro.entradaEm, agora);
      const pago = await this.repo.marcarPago(registro.id, valorCobrado, agora);

      return {
        valorCobrado: pago.valorCobrado,
        pagoEm: pago.pagoEm?.toISOString(),
        status: pago.status,
        janelaSaidaExpiraEm: pago.pagoEm ? expiracaoJanela(pago.pagoEm).toISOString() : null,
      };
    } catch (error) {
      this.rethrow(error);
    }
  }

  async pagarMulta(token: string) {
    try {
      const registro = await this.ticketNoPatio(token);
      if (registro.status !== 'multa_pendente') {
        throw new AppError(409, 'MULTA_NAO_PENDENTE', 'Não há multa pendente para este ticket');
      }

      const agora = this.clock();
      const pago = await this.repo.marcarMultaPaga(registro.id, agora);

      return {
        valorMulta: pago.valorMulta,
        pagoEm: pago.pagoEm?.toISOString(),
        status: pago.status,
        janelaSaidaExpiraEm: pago.pagoEm ? expiracaoJanela(pago.pagoEm).toISOString() : null,
      };
    } catch (error) {
      this.rethrow(error);
    }
  }

  async registrarSaida(token: string) {
    try {
      const registro = await this.ticketNoPatio(token);
      const agora = this.clock();

      if (registro.status === 'ativo') {
        throw new AppError(402, 'PAGAMENTO_PENDENTE', 'Pagamento pendente');
      }

      if (registro.status === 'multa_pendente') {
        throw new AppError(402, 'MULTA_PENDENTE', 'Há multa pendente', {
          valorMulta: registro.valorMulta,
        });
      }

      if (registro.status === 'pago' && registro.pagoEm && janelaSaidaExpirada(registro.pagoEm, agora)) {
        const valorMulta = calcularMulta(registro.valorCobrado ?? 0);
        await this.repo.marcarMultaPendente(registro.id, valorMulta);
        throw new AppError(409, 'JANELA_SAIDA_EXPIRADA', 'Janela de saída expirada', { valorMulta });
      }

      const finalizado = await this.repo.finalizarSaida(registro.id, agora);
      return {
        id: finalizado.id,
        placa: finalizado.placa,
        entradaEm: finalizado.entradaEm.toISOString(),
        saidaEm: finalizado.saidaEm?.toISOString(),
        duracaoMinutos: minutosEntre(finalizado.entradaEm, finalizado.saidaEm ?? agora),
        valorCobrado: finalizado.valorCobrado,
        status: finalizado.status,
      };
    } catch (error) {
      this.rethrow(error);
    }
  }

  async listarAtivos() {
    try {
      const agora = this.clock();
      const registros = await this.repo.listarNoPatio();
      return registros.map((registro) => ({
        placa: registro.placa,
        motoristaNome: registro.motoristaNome,
        token: registro.token,
        entradaEm: registro.entradaEm.toISOString(),
        status: registro.status,
        tempoDecorridoMinutos: minutosEntre(registro.entradaEm, agora),
      }));
    } catch (error) {
      this.rethrow(error);
    }
  }

  async historico(placa: string) {
    try {
      if (!validarPlaca(placa)) {
        throw new AppError(400, 'PLACA_INVALIDA', 'Placa inválida');
      }
      const registros = await this.repo.historicoPorPlaca(normalizarPlaca(placa));
      return registros.map((registro) => ({
        id: registro.id,
        placa: registro.placa,
        entradaEm: registro.entradaEm.toISOString(),
        saidaEm: registro.saidaEm?.toISOString() ?? null,
        valorCobrado: registro.valorCobrado,
        status: registro.status,
      }));
    } catch (error) {
      this.rethrow(error);
    }
  }

  private async ticketNoPatio(token: string): Promise<Registro> {
    if (!validarToken(token)) {
      throw new AppError(400, 'TOKEN_INVALIDO', 'Token inválido');
    }
    const registro = await this.repo.buscarPorToken(token);
    if (!registro || !noPatio(registro.status)) {
      throw new AppError(404, 'TOKEN_INVALIDO', 'Token inválido');
    }
    return registro;
  }

  private rethrow(error: unknown): never {
    if (error instanceof AppError) throw error;
    if (error instanceof RepositoryError) {
      if (error.code === 'PLACA_JA_ATIVA') {
        throw new AppError(409, 'PLACA_JA_ATIVA', error.message);
      }
      if (error.code === 'ERRO_BANCO') {
        throw new AppError(503, 'SERVICO_INDISPONIVEL', 'Serviço indisponível');
      }
      throw new AppError(404, 'REGISTRO_NAO_ENCONTRADO', error.message);
    }
    throw new AppError(503, 'SERVICO_INDISPONIVEL', 'Serviço indisponível');
  }
}
