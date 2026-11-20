import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import multer from 'multer';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { checkDatabaseHealth } from './db/pool';
import { AppError, errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { importRouter } from './routes/importRoutes';

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
  app.use(express.json({ limit: '5mb' }));
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

  // API v1 Routes
  app.use('/api/v1/imports', importRouter);

  // Convert Multer file size errors to consistent AppError format
  app.use((err: unknown, _req: Request, _res: Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new AppError(413, 'FILE_TOO_LARGE', 'Uploaded file exceeds the 5MB limit'));
        return;
      }
      next(new AppError(400, 'UPLOAD_ERROR', err.message));
      return;
    }
    next(err);
  });

  // 404 and Central Error Handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
