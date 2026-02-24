import { createApiClient } from '@repo/api-client';
import { env } from './env';

export const apiClient = createApiClient(env.VITE_BACKEND_URL);
