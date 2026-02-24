import { z } from 'zod';

export const CultureBeJobsQuery$ = z.object({
  page: z.coerce.number().int().positive().default(1),
});
export type CultureBeJobsQuery = z.infer<typeof CultureBeJobsQuery$>;

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
  pagination: z.object({
    page: z.number().int().positive(),
    totalPages: z.number().int().positive(),
    hasPrev: z.boolean(),
    hasNext: z.boolean(),
  }),
  source: z.literal('culture.be'),
  fetchedAt: z.iso.datetime(),
});
export type CultureBeJobsResponse = z.infer<typeof CultureBeJobsResponse$>;
