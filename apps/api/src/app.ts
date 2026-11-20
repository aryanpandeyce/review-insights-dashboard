import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { checkDatabaseHealth } from './db/pool';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

export function createApp(): Express {
  const app = express();

  // Security headers & CORS
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Structured request logging
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/health',
      },
    })
  );

  // Health check endpoint (root /health and /api/v1/health)
  const healthHandler = async (_req: Request, res: Response): Promise<void> => {
    const dbHealthy = await checkDatabaseHealth();
    const status = dbHealthy ? 200 : 503;

    res.status(status).json({
      success: dbHealthy,
      data: {
        status: dbHealthy ? 'ok' : 'degraded',
        service: 'review-insights-api',
        database: dbHealthy ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      },
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/v1/health', healthHandler);

  // 404 and Central Error Handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
