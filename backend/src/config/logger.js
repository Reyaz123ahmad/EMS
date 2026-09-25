import pino from 'pino';
import env from './env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: {
    instance: process.env.INSTANCE_ID || 'unknown',
    port: process.env.PORT ? Number(process.env.PORT) : 5000
  },
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          }
        }
      : undefined
});

export default logger;
