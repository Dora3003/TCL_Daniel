import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createApp } from './app.js';
import { checkConnection } from './db/pool.js';
import { RegistroRepository } from './repositories/registro.repository.js';
import { RegistroService } from './services/registro.service.js';

config({ path: resolve(process.cwd(), '../.env') });
config();

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const port = Number(process.env.PORT ?? 3000);
const service = new RegistroService(new RegistroRepository(), frontendUrl);
const app = createApp(service, checkConnection);

app.listen(port, '0.0.0.0', () => {
  console.log(`API escutando em http://0.0.0.0:${port}`);
});
