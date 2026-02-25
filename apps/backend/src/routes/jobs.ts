import {
  getCultureBeLastSyncAt,
  getPersistedCultureBeJobByUid,
  listPersistedCultureBeJobs,
  syncNewCultureBeJobs,
} from '@/services/culture-be-jobs';
import { zValidator } from '@hono/zod-validator';
import { CultureBeJob$, CultureBeJobsResponse$, CultureBeJobSyncResponse$ } from '@repo/utils';
import { Hono } from 'hono';
import { z } from 'zod';

const JobIdParam$ = z.object({
  id: z.coerce.number().int().positive(),
});

export const jobsRoutes = new Hono()
  .get('/', async c => {
    c.get('logStep')?.info('Received request for persisted culture.be jobs');

    try {
      const jobs = await listPersistedCultureBeJobs();
      const lastSyncedAt = await getCultureBeLastSyncAt();
      const response = CultureBeJobsResponse$.parse({
        data: jobs,
        source: 'culture.be',
        fetchedAt: new Date().toISOString(),
        lastSyncedAt,
      });
      return c.json(response);
    } catch (error) {
      c.get('logStep')?.error('Failed to fetch persisted jobs', {
        error: error instanceof Error ? error.message : String(error),
      });
      return c.json({ error: 'Failed to fetch job offers' }, 500);
    }
  })
  .post('/sync', async c => {
    c.get('logStep')?.info('Received request to sync new culture.be jobs');

    try {
      const result = await syncNewCultureBeJobs(c.get('logStep'));
      return c.json(CultureBeJobSyncResponse$.parse(result));
    } catch (error) {
      c.get('logStep')?.error('Failed to sync culture.be jobs', {
        error: error instanceof Error ? error.message : String(error),
      });
      return c.json({ error: 'Failed to sync job offers' }, 502);
    }
  })
  .get('/:id', zValidator('param', JobIdParam$), async c => {
    const { id } = c.req.valid('param');
    c.get('logStep')?.info('Received request for a specific persisted job', { uid: id });

    try {
      const job = await getPersistedCultureBeJobByUid(id);
      if (!job) {
        return c.json({ error: 'Job not found' }, 404);
      }
      return c.json(CultureBeJob$.parse(job));
    } catch (error) {
      c.get('logStep')?.error('Failed to fetch persisted job', {
        uid: id,
        error: error instanceof Error ? error.message : String(error),
      });
      return c.json({ error: 'Failed to fetch job offer' }, 500);
    }
  });
