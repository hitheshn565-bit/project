import knex, { Knex } from 'knex';
import { env } from './env';
import { logger } from '../utils/logger';

const config: Knex.Config = {
  client: 'pg',
  connection: env.db.url || {
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password,
  },
  pool: { min: 2, max: 10 },
};

export const db = knex(config);

// Simple health check
export async function verifyDbConnection(): Promise<void> {
  try {
    await db.raw('select 1+1 as result');
    logger.info('Database connection verified');
  } catch (err) {
    logger.error('Database connection failed', { err });
    throw err;
  }
}
