import { getRoomName, Log$, type LogCreate, LogCreate$ } from '@repo/utils';
import winston from 'winston';
import Transport from 'winston-transport';
import { env } from './env';
import { prisma } from './prisma';
import { emitToRoom } from './socket';

class PostgresTransport extends Transport {
  override async log(info: LogCreate, callback: () => void) {
    setImmediate(callback);

    const { level, message, type, userId, metadata, method, path, statusCode, durationMs, steps } =
      LogCreate$.parse(info);

    try {
      const log = await prisma.log.create({
        data: {
          type,
          level,
          message,
          userId: userId ?? undefined,
          metadata: metadata ?? undefined,
          method,
          path,
          statusCode,
          durationMs,
          steps: steps ?? undefined,
        },
      });
      // Emit the new log to all subscribed clients
      emitToRoom(getRoomName.logs, 'log:created', Log$.parse(log));
    } catch (err) {
      // NEVER throw from logger - errors degrade gracefully
      console.error('Failed to persist log', err);
    }
  }
}

const isDev = env.NODE_ENV === 'development';

export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      level: isDev ? 'debug' : 'warn',
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new PostgresTransport({
      level: 'info',
    }),
  ],
});
