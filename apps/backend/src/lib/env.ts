import { NodeEnv$ } from '@repo/utils';
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: NodeEnv$,
  PORT: z.coerce.number().default(3000),

  BACKEND_URL: z.url().default('http://localhost:3000'),
  FRONTEND_URL: z.url().default('http://localhost:5173'),
  ADMIN_URL: z.url().default('http://localhost:5174'),

  // This environment variable comes from the database package's .env file
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
});

export const env = envSchema.parse(process.env);
