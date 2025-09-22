import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './utils/logger';
import { router as apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import scraperRoutes from './routes/scraper';
import recommendationRoutes from './routes/recommendations';
import { specs } from './docs/swagger';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ 
    origin: ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080', 'http://127.0.0.1:3000'],
    credentials: true 
  }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({ windowMs: env.rateLimit.windowMs, max: env.rateLimit.max });
  app.use(limiter);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  app.use(`/api/${env.apiVersion}/docs`, swaggerUi.serve, swaggerUi.setup(specs));

  app.use('/api/v1', apiRouter);
  app.use('/api/v1/scraper', scraperRoutes);
  app.use('/api/v1/recommendations', recommendationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { err });
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason });
  });

  return app;
}
