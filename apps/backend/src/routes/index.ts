import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { useAuth } from '@/middlewares/use-auth';
import { useLogger } from '@/middlewares/use-logger';
import { Hono } from 'hono';
import { healthRoutes } from './health';
import { logsRoutes } from './logs';

export const routes = new Hono()
  .use(useAuth)

  .route('/health', healthRoutes)
  .route('/logs', logsRoutes)
  .post('/studio', async c => {
    const { query } = await c.req.json();
    const results = await prisma.$queryRawUnsafe(query.sql, ...query.parameters);
    return c.json([null, results]);
  })
  .on(['POST', 'GET'], '/auth/*', c => auth.handler(c.req.raw))
  //////////////////////////////////////////////////
  // Add routes without logging middleware here
  //////////////////////////////////////////////////
  .use('*', useLogger)
  //////////////////////////////////////////////////
  // Add routes with logging middleware applied here

  //////////////////////////////////////////////////
  // Global error handler
  .onError((err, c) => {
    if (c.get('logStep')) {
      c.get('logStep').error('Unhandled error occurred in route', { error: err.message });
    } else {
      logger.error('Unhandled error occurred', {
        metadata: { error: err.message, stack: err.stack, ctx: err.cause, name: err.name },
      });
    }
    return c.json({ message: 'Internal Server Error' }, 500);
  });
