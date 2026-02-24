import { z } from 'zod';

export const CultureBeJob$ = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  employer: z.string().min(1),
  title: z.string().min(1),
  contract: z.string().min(1).nullable(),
  type: z.string().min(1),
  link: z.url(),
});
export type CultureBeJob = z.infer<typeof CultureBeJob$>;

export const CultureBeJobsResponse$ = z.object({
  data: CultureBeJob$.array(),
  source: z.literal('culture.be'),
  fetchedAt: z.iso.datetime(),
});
export type CultureBeJobsResponse = z.infer<typeof CultureBeJobsResponse$>;
