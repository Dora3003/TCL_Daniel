import { randomBytes } from 'node:crypto';

const PLACA_ANTIGA = /^[A-Z]{3}\d{4}$/;
const PLACA_MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/;
const TOKEN = /^[A-Z0-9]{7}$/;
const ALFABETO_TOKEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const TARIFA_POR_HORA = 5;
const MINIMO_HORAS = 1;
const JANELA_SAIDA_MS = 10 * 60 * 1000;
const ALIQUOTA_MULTA = 0.15;

export function normalizarPlaca(placa: string): string {
  return placa.trim().toUpperCase().replace(/[\s-]/g, '');
}

export function validarPlaca(placa: string): boolean {
  const normalizada = normalizarPlaca(placa);
  return PLACA_ANTIGA.test(normalizada) || PLACA_MERCOSUL.test(normalizada);
}

export function validarToken(token: string): boolean {
  return TOKEN.test(normalizarToken(token));
}

export function normalizarToken(token: string): string {
  return token.trim().toUpperCase();
}

export function gerarToken(): string {
  const bytes = randomBytes(7);
  let token = '';
  for (const byte of bytes) {
    token += ALFABETO_TOKEN[byte % ALFABETO_TOKEN.length];
  }
  return token;
}

export function calcularValor(entradaEm: Date, saidaEm: Date): number {
  const diffMs = saidaEm.getTime() - entradaEm.getTime();
  const horas = Math.ceil(diffMs / (1000 * 60 * 60));
  const horasCobradas = Math.max(horas, MINIMO_HORAS);
  return horasCobradas * TARIFA_POR_HORA;
}

export function calcularMulta(valorCobrado: number): number {
  return Math.round(valorCobrado * ALIQUOTA_MULTA * 100) / 100;
}

export function janelaSaidaExpirada(pagoEm: Date, agora: Date): boolean {
  return agora.getTime() - pagoEm.getTime() >= JANELA_SAIDA_MS;
}

export function expiracaoJanela(pagoEm: Date): Date {
  return new Date(pagoEm.getTime() + JANELA_SAIDA_MS);
}

export function minutosEntre(inicio: Date, fim: Date): number {
  return Math.max(0, Math.floor((fim.getTime() - inicio.getTime()) / 60000));
}
