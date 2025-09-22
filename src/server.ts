import 'module-alias/register';
import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { verifyDbConnection } from './config/db';
import { connectRedis } from './config/redis';

async function bootstrap() {
  try {
    await verifyDbConnection();
    await connectRedis();

    const app = createApp();
    const server = http.createServer(app);

    server.listen(env.port, () => {
      logger.info(`Server listening on http://localhost:${env.port}/api/${env.apiVersion}`);
    });

    const shutdown = () => {
      logger.info('Shutting down server...');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      // Force exit after 10s
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    logger.error('Failed to bootstrap application', { err });
    process.exit(1);
  }
}

bootstrap();
