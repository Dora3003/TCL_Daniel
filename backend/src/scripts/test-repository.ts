import { checkConnection } from '../db/pool.js';
import { RegistroRepository } from '../repositories/registro.repository.js';
import { RepositoryError } from '../types/registro.js';

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

  const entrada = await repo.registrarEntrada(placaTeste);
  console.log('  Entrada:', entrada.placa, entrada.status);

  const ativos = await repo.listarAtivos();
  console.log(`→ Veículos ativos: ${ativos.length}`);

  try {
    await repo.registrarEntrada(placaTeste);
    console.error('❌ Deveria ter falhado com PLACA_JA_ATIVA');
    process.exit(1);
  } catch (error) {
    if (error instanceof RepositoryError && error.code === 'PLACA_JA_ATIVA') {
      console.log('✅ Constraint de placa ativa funcionando');
    } else {
      throw error;
    }
  }

  const saida = await repo.registrarSaida(placaTeste, 5.0);
  console.log('→ Saída:', saida.valorCobrado, 'BRL');
  const historico = await repo.historicoPorPlaca(placaTeste);
  console.log(`→ Histórico: ${historico.length} registro(s)`);
  console.log('\n✅ Repositório validado com sucesso');
}

main().catch((error) => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
