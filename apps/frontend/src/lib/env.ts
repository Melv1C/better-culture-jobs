import { NodeEnv$ } from '@repo/utils';
import { z } from 'zod';

const envSchema = z.object({
  VITE_NODE_ENV: NodeEnv$,
  VITE_PORT: z.coerce.number().default(5173),

  VITE_BACKEND_URL: z.url().default('http://localhost:3000'),
  VITE_FRONTEND_URL: z.url().default('http://localhost:5173'),
  VITE_ADMIN_URL: z.url().default('http://localhost:5174'),
});

export const env = envSchema.parse(import.meta.env);
