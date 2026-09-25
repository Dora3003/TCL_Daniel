import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { AppError } from './types/registro.js';
import { RegistroService } from './services/registro.service.js';

const entradaSchema = z
  .object({
    placa: z.string(),
    motoristaNome: z.string(),
    modelo: z.string().optional(),
    cor: z.string().optional(),
  })
  .passthrough();

const saidaSchema = z.object({
  token: z.string(),
});

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function createApp(
  service: RegistroService,
  checkDb: () => Promise<boolean>,
) {
  const app = express();
  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json());

  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - started}ms`);
    });
    next();
  });

  app.get(
    '/api/health',
    asyncHandler(async (_req, res) => {
      const connected = await checkDb();
      res.status(connected ? 200 : 503).json({
        status: 'ok',
        db: connected ? 'connected' : 'disconnected',
      });
    }),
  );

  app.post(
    '/api/entrada',
    asyncHandler(async (req, res) => {
      const parsed = entradaSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'REQUISICAO_INVALIDA', 'Requisição inválida');
      }
      const body = await service.registrarEntrada(parsed.data);
      res.status(201).json(body);
    }),
  );

  app.get(
    '/api/tickets/:token',
    asyncHandler(async (req, res) => {
      const body = await service.obterTicket(req.params.token);
      res.status(200).json(body);
    }),
  );

  app.post(
    '/api/tickets/:token/pagamentos',
    asyncHandler(async (req, res) => {
      const body = await service.pagar(req.params.token);
      res.status(200).json(body);
    }),
  );

  app.post(
    '/api/tickets/:token/multas',
    asyncHandler(async (req, res) => {
      const body = await service.pagarMulta(req.params.token);
      res.status(200).json(body);
    }),
  );

  app.post(
    '/api/saida',
    asyncHandler(async (req, res) => {
      const parsed = saidaSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'REQUISICAO_INVALIDA', 'Requisição inválida');
      }
      const body = await service.registrarSaida(parsed.data.token);
      res.status(200).json(body);
    }),
  );

  app.get(
    '/api/ativos',
    asyncHandler(async (_req, res) => {
      const body = await service.listarAtivos();
      res.status(200).json(body);
    }),
  );

  app.get(
    '/api/historico/:placa',
    asyncHandler(async (req, res) => {
      const body = await service.historico(req.params.placa);
      res.status(200).json(body);
    }),
  );

  app.all('/api/*', (req, res, next) => {
    if (res.headersSent) return next();
    res.status(405).json({ erro: 'METODO_NAO_PERMITIDO', mensagem: 'Método não suportado' });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof SyntaxError) {
      res.status(400).json({ erro: 'REQUISICAO_INVALIDA', mensagem: 'JSON malformado' });
      return;
    }
    if (error instanceof AppError) {
      res.status(error.status).json({
        erro: error.code,
        mensagem: error.message,
        ...error.extras,
      });
      return;
    }
    console.error(error);
    res.status(500).json({ erro: 'ERRO_INTERNO', mensagem: 'Erro interno' });
  });

  return app;
}
