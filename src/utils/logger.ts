/* eslint-disable @typescript-eslint/indent */
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const level =
  process.env.LOG_LEVEL?.toLowerCase() || (isProduction ? 'info' : 'debug');

const transport = pino.transport({
  targets: [
    ...(isProduction
      ? []
      : [
          {
            target: 'pino-pretty',
            level,
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname'
            }
          }
        ]),
    {
      target: 'pino/file',
      level,
      options: {
        destination: './logs/app.log',
        mkdir: true
      }
    },
    {
      target: 'pino/file',
      level: 'error',
      options: {
        destination: './logs/error.log',
        mkdir: true
      }
    }
  ]
});

const baseLogger = pino({ level, base: { service: 'express-api' } }, transport);

const logger = {
  debug: (message: string, meta?: unknown) => {
    if (meta === undefined) {
      baseLogger.debug(message);
      return;
    }
    baseLogger.debug({ meta }, message);
  },
  info: (message: string, meta?: unknown) => {
    if (meta === undefined) {
      baseLogger.info(message);
      return;
    }
    baseLogger.info({ meta }, message);
  },
  warn: (message: string, meta?: unknown) => {
    if (meta === undefined) {
      baseLogger.warn(message);
      return;
    }
    baseLogger.warn({ meta }, message);
  },
  error: (message: string, meta?: unknown) => {
    if (meta === undefined) {
      baseLogger.error(message);
      return;
    }
    if (meta instanceof Error) {
      baseLogger.error({ err: meta }, message);
      return;
    }
    baseLogger.error({ meta }, message);
  },
  child: (bindings: Record<string, unknown>) => baseLogger.child(bindings),
  raw: baseLogger
};

export default logger;
