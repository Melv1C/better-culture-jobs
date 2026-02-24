import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { type Session, type User, User$ } from '@repo/utils';
import type { Context, Next } from 'hono';

declare module 'hono' {
  interface ContextVariableMap {
    session: Session | null;
    user: User | null;
  }
}

export const useAuth = async (c: Context, next: Next) => {
  const sessionData = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  const user = sessionData?.user ? User$.safeParse(sessionData.user) : null;

  if (user && !user.success) {
    if (c.get('logStep')) {
      c.get('logStep').error('Invalid user data in session', { error: user.error.message });
    } else {
      logger.error('Invalid user data in session but logStep is missing', {
        metadata: { error: user.error.message },
      });
    }
    throw user.error;
  }

  c.set('session', sessionData?.session || null);
  c.set('user', user?.data || null);

  await next();
};

export const isAuthenticated = async (c: Context, next: Next) => {
  const user = c.get('user');

  if (!user) {
    if (c.get('logStep')) {
      c.get('logStep').error('Authentication required but no user found');
    } else {
      logger.error('Authentication required but no user found');
    }
    return c.json({ error: 'Authentication required' }, 401);
  }

  await next();
};

export const isAdmin = async (c: Context, next: Next) => {
  const user = c.get('user');

  if (!user) {
    if (c.get('logStep')) {
      c.get('logStep').error('Authentication required but no user found');
    } else {
      logger.error('Authentication required but no user found');
    }
    return c.json({ error: 'Authentication required' }, 401);
  }

  if (user.role !== 'admin') {
    if (c.get('logStep')) {
      c.get('logStep').error('Admin role required but user is not an admin', {
        user,
      });
    } else {
      logger.error('Admin role required but user is not an admin', {
        userId: user?.id,
        metadata: { user },
      });
    }
    return c.json({ error: 'Admin role required' }, 403);
  }

  await next();
};
