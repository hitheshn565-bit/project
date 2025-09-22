import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp as string} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

export const logger = winston.createLogger({
  level: env.logging.level,
  format: env.logging.format === 'json' ? combine(timestamp(), json()) : combine(colorize(), timestamp(), logFormat),
  transports: [
    new winston.transports.Console(),
  ],
});
