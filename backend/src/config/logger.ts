import winston from 'winston';
import { env } from './env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  if (stack) log += `\n${stack}`;
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  if (metaStr) log += `\n${metaStr}`;
  return log;
});

export const logger = winston.createLogger({
  level: env.IS_PRODUCTION ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    env.IS_PRODUCTION ? winston.format.json() : combine(colorize(), logFormat)
  ),
  transports: [
    new winston.transports.Console(),
    ...(env.IS_PRODUCTION
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
  // NEVER log sensitive fields
  defaultMeta: {},
});

// Mask sensitive fields before logging
export function maskSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'cpf', 'telefone', 'phone', 'authorization'];
  const result = { ...obj };
  for (const key of sensitiveKeys) {
    if (key in result) {
      result[key] = '***MASKED***';
    }
  }
  return result;
}

export default logger;
