import { checkConnection } from '../db/pool.js';
import { RegistroRepository } from '../repositories/registro.repository.js';
import { RepositoryError } from '../types/registro.js';
import { gerarToken } from '../domain/regras.js';

async function main() {
  const connected = await checkConnection();
  if (!connected) {
    console.error('❌ Banco indisponível. Execute: docker compose up -d');
    process.exit(1);
  }

  const repo = new RegistroRepository();
  const placaTeste = `TST${Date.now().toString().slice(-4)}`;

  console.log('✅ Conexão com PostgreSQL OK');
  console.log(`→ Registrando entrada: ${placaTeste}`);

  const entrada = await repo.registrarEntrada({
    placa: placaTeste,
    motoristaNome: 'Teste',
    token: gerarToken(),
    entradaEm: new Date(),
  });
  console.log('  Entrada:', entrada.placa, entrada.status, entrada.token);

  const ativos = await repo.listarNoPatio();
  console.log(`→ Veículos no pátio: ${ativos.length}`);

  try {
    await repo.registrarEntrada({
      placa: placaTeste,
      motoristaNome: 'Teste',
      token: gerarToken(),
      entradaEm: new Date(),
    });
    console.error('❌ Deveria ter falhado com PLACA_JA_ATIVA');
    process.exit(1);
  } catch (error) {
    if (error instanceof RepositoryError && error.code === 'PLACA_JA_ATIVA') {
      console.log('✅ Constraint de placa no pátio funcionando');
    } else {
      throw error;
    }
  }

  const pago = await repo.marcarPago(entrada.id, 5, new Date());
  const saida = await repo.finalizarSaida(pago.id, new Date());
  console.log('→ Saída:', saida.valorCobrado, 'BRL', saida.status);
  const historico = await repo.historicoPorPlaca(placaTeste);
  console.log(`→ Histórico: ${historico.length} registro(s)`);
  console.log('\n✅ Repositório validado com sucesso');
}

main().catch((error) => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
