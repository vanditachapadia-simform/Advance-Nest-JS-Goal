import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

/**
 * Centralised Winston configuration.
 *
 * - Console transport with colourised, human-readable output in development.
 * - JSON-structured daily-rotating file transports for app + error logs,
 *   suitable for shipping to a log aggregator (ELK / Loki / CloudWatch).
 */
export function buildWinstonOptions(isProduction: boolean): WinstonModuleOptions {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.combine(winston.format.timestamp(), winston.format.json())
        : winston.format.combine(
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.colorize({ all: true }),
            winston.format.printf(({ timestamp, level, message, context, correlationId }) => {
              const ctx = context ? `[${context}] ` : '';
              const cid = correlationId ? ` (cid=${String(correlationId).slice(0, 8)})` : '';
              return `${timestamp} ${level} ${ctx}${message}${cid}`;
            }),
          ),
    }),
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ];

  return {
    level: isProduction ? 'info' : 'debug',
    defaultMeta: { service: 'logistics-platform' },
    transports,
  };
}
