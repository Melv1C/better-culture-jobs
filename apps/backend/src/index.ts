import { env } from '@/lib/env';
import { initializeSocketIO } from '@/lib/socket';
import { routes } from '@/routes';
import { serve } from '@hono/node-server';
import { APP_NAME, APP_VERSION } from '@repo/utils';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Server as HTTPServer } from 'node:http';

const app = new Hono()
  .use(
    cors({
      origin: [env.FRONTEND_URL, env.ADMIN_URL,],
      credentials: true,
    }),
  )
  .route('/api', routes);

export type AppType = typeof app;

const httpServer = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  info => {
    console.log(`🚀 Backend server running on port ${info.port}`);
    console.log(`   App Name: ${APP_NAME}`);
    console.log(`   App Version: ${APP_VERSION}`);
  },
);

// Initialize Socket.IO with the HTTP server
initializeSocketIO(httpServer as HTTPServer);
