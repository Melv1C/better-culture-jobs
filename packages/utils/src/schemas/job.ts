import { z } from 'zod';

export const CultureBeJobType$ = z.enum(['emploi', 'stage', 'bénévolat', 'autre']);
export const CultureBeJobPostingType$ = z.enum(['EMPLOI', 'STAGE', 'BENEVOLAT', 'AUTRE']);
export const CultureBeContractType$ = z.enum(['CDD', 'CDI', 'AUTRE']);

export const CultureBeJob$ = z.object({
  id: z.string().min(1),
  uid: z.int().positive().optional(),
  date: z.string().min(1),
  publicationDate: z.iso.datetime().optional(),
  employer: z.string().min(1),
  title: z.string().min(1),
  contract: z.string().min(1).nullable(),
  contractTypes: CultureBeContractType$.array().optional(),
  type: CultureBeJobType$.or(z.string().min(1)),
  jobType: CultureBeJobPostingType$.optional(),
  link: z.url(),
  listingUrl: z.url().optional(),
  location: z.string().nullable().optional(),
  applicationDeadline: z.iso.datetime().nullable().optional(),
  applicationDeadlineRaw: z.string().nullable().optional(),
  jobDescription: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
  contractDetails: z.string().nullable().optional(),
  regime: z.string().nullable().optional(),
  applicationInstructions: z.string().nullable().optional(),
  documentsRequired: z.string().nullable().optional(),
  comments: z.string().nullable().optional(),
  employerDescription: z.string().nullable().optional(),
  employerSectors: z.string().nullable().optional(),
  contactDetails: z.string().nullable().optional(),
  moreInfo: z.string().nullable().optional(),
  rawDetails: z.unknown().nullable().optional(),
  lastUpdated: z.iso.datetime().optional(),
});
export type CultureBeJob = z.infer<typeof CultureBeJob$>;

export const CultureBeJobsResponse$ = z.object({
  data: CultureBeJob$.array(),
  source: z.literal('culture.be'),
  fetchedAt: z.iso.datetime(),
  lastSyncedAt: z.iso.datetime().nullable(),
});
export type CultureBeJobsResponse = z.infer<typeof CultureBeJobsResponse$>;

export const CultureBeJobSyncResponse$ = z.object({
  source: z.literal('culture.be'),
  syncedAt: z.iso.datetime(),
  scanned: z.int().nonnegative(),
  existing: z.int().nonnegative(),
  newFound: z.int().nonnegative(),
  inserted: z.int().nonnegative(),
  removed: z.int().nonnegative(),
  removedUids: z.int().positive().array(),
  failed: z.int().nonnegative(),
  failedUids: z.int().positive().array(),
});
export type CultureBeJobSyncResponse = z.infer<typeof CultureBeJobSyncResponse$>;
