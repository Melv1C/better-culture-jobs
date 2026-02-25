import { prisma, type Prisma } from '@/lib/prisma';
import { StepLogger } from '@/middlewares/use-logger';
import * as cheerio from 'cheerio';
import sanitizeHtml from 'sanitize-html';

const CULTURE_BE_ORIGIN = 'https://www.culture.be';
const CULTURE_BE_JOBS_PATH = '/vous-cherchez/emploi-stage/';
const CULTURE_BE_PAGE_PARAM = 'cfwb_form[cfwb_form.list_offre_emploi][page]';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_DETAIL_CONCURRENCY = 4;
const CULTURE_BE_SOURCE = 'CULTURE_BE' as const;
const REQUEST_HEADERS = {
  'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
  'user-agent': 'Mozilla/5.0 (compatible; better-culture-jobs/1.0)',
};
const ALLOWED_DETAIL_TAGS = ['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'a'];

type JobPostingType = 'EMPLOI' | 'STAGE' | 'BENEVOLAT' | 'AUTRE';
type ContractType = 'CDD' | 'CDI' | 'AUTRE';

type ListingJob = {
  uid: number;
  sourceUrl: string;
  listingUrl: string;
  title: string;
  organization: string;
  publicationDate: Date;
  publicationDateRaw: string;
  postingType: JobPostingType;
  contractLabel: string | null;
  contractTypes: ContractType[];
};

type DetailField = {
  section: string;
  label: string;
  value: string;
};

type ParsedDetail = {
  location: string | null;
  applicationDeadline: Date | null;
  applicationDeadlineRaw: string | null;
  jobDescription: string | null;
  requirements: string | null;
  contractDetails: string | null;
  regime: string | null;
  applicationInstructions: string | null;
  documentsRequired: string | null;
  comments: string | null;
  employerDescription: string | null;
  employerSectors: string | null;
  contactDetails: string | null;
  moreInfo: string | null;
  rawDetails: Prisma.InputJsonValue | null;
};

export type CultureBePersistedJob = {
  id: string;
  uid: number;
  link: string;
  listingUrl: string;
  title: string;
  employer: string;
  date: string;
  publicationDate: string;
  contract: string | null;
  contractTypes: ContractType[];
  type: string;
  jobType: JobPostingType;
  location: string | null;
  applicationDeadline: string | null;
  applicationDeadlineRaw: string | null;
  jobDescription: string | null;
  requirements: string | null;
  contractDetails: string | null;
  regime: string | null;
  applicationInstructions: string | null;
  documentsRequired: string | null;
  comments: string | null;
  employerDescription: string | null;
  employerSectors: string | null;
  contactDetails: string | null;
  moreInfo: string | null;
  rawDetails: Prisma.JsonValue | null;
  lastUpdated: string;
};

export type CultureBeSyncSummary = {
  source: 'culture.be';
  syncedAt: string;
  scanned: number;
  existing: number;
  newFound: number;
  inserted: number;
  removed: number;
  removedUids: number[];
  failed: number;
  failedUids: number[];
};

function normalizeText(value: string | undefined | null): string {
  return (value ?? '').replaceAll('\u00a0', ' ').replace(/\s+/g, ' ').trim();
}

function normalizeMultilineText(value: string | undefined | null): string {
  return (value ?? '')
    .replaceAll('\u00a0', ' ')
    .replaceAll('\r', '')
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function stripHtmlToText(value: string | undefined | null): string {
  const html = value ?? '';
  if (!html) return '';

  const $ = cheerio.load(`<div id="text-root">${html}</div>`);
  return normalizeText($('#text-root').text());
}

function escapeHtmlText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sanitizeDetailHtml(rawHtml: string): string {
  const sanitized = sanitizeHtml(rawHtml, {
    allowedTags: ALLOWED_DETAIL_TAGS,
    allowedAttributes: {
      a: ['href', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      a: ['http', 'https', 'mailto'],
    },
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
  });

  if (!sanitized) return '';

  const $ = cheerio.load(`<div id="detail-root">${sanitized}</div>`);
  const root = $('#detail-root');

  root.find('*').each((_, element) => {
    const node = $(element);
    const attributes = element.attribs ? Object.keys(element.attribs) : [];

    for (const attributeName of attributes) {
      const normalizedAttributeName = attributeName.toLowerCase();
      if (
        normalizedAttributeName === 'class' ||
        normalizedAttributeName === 'style' ||
        normalizedAttributeName.startsWith('on')
      ) {
        node.removeAttr(attributeName);
      }
    }

    if (node.is('a')) {
      const href = normalizeText(node.attr('href'));
      if (!href) {
        node.replaceWith(node.text());
        return;
      }
      node.attr('rel', 'noopener noreferrer nofollow');
    }
  });

  const cleanedHtml = (root.html() ?? '').trim();
  if (!cleanedHtml) return '';
  if (!stripHtmlToText(cleanedHtml)) return '';

  return cleanedHtml;
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseCultureBeDate(value: string): Date | null {
  const match = normalizeText(value).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;

  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);

  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function parsePostingType(value: string): JobPostingType {
  const normalized = normalizeKey(value);
  if (normalized.includes('benevolat')) return 'BENEVOLAT';
  if (normalized.includes('stage')) return 'STAGE';
  if (normalized.includes('emploi')) return 'EMPLOI';
  return 'AUTRE';
}

function parseContractTypes(value: string): ContractType[] {
  const contractTypes = new Set<ContractType>();
  const rawTokens = value.split(',').map(token => normalizeKey(token));

  for (const token of rawTokens) {
    if (!token) continue;
    if (token.includes('cdd')) contractTypes.add('CDD');
    if (token.includes('cdi')) contractTypes.add('CDI');
    if (token.includes('autre')) contractTypes.add('AUTRE');
  }

  return Array.from(contractTypes);
}

function firstNonEmpty(...values: Array<string | null>): string | null {
  for (const value of values) {
    if (value && stripHtmlToText(value) !== '') return value;
  }
  return null;
}

function findDateToken(value: string): string | null {
  const match = stripHtmlToText(value).match(/\b(\d{2}-\d{2}-\d{4})\b/);
  return match?.[1] ?? null;
}

function buildCultureBeJobsUrl(page: number): string {
  const url = new URL(CULTURE_BE_JOBS_PATH, CULTURE_BE_ORIGIN);
  if (page > 1) {
    url.searchParams.set(CULTURE_BE_PAGE_PARAM, String(page));
  }
  return url.toString();
}

function toAbsoluteUrl(url: string): string {
  try {
    return new URL(url, CULTURE_BE_ORIGIN).toString();
  } catch {
    return new URL(CULTURE_BE_JOBS_PATH, CULTURE_BE_ORIGIN).toString();
  }
}

function parseTotalPages($: cheerio.CheerioAPI): number {
  const pageText = normalizeText($('tr.bottom-row td[align="center"]').first().text());
  const pageMatch = pageText.match(/(\d+)\s*\/\s*(\d+)/);
  const totalPagesFromText = parsePositiveInt(pageMatch?.[2] ?? null);
  if (totalPagesFromText) return totalPagesFromText;

  const lastLink = $('a[id$="_pagelink_last"]').attr('href');
  if (lastLink) {
    try {
      const url = new URL(lastLink, CULTURE_BE_ORIGIN);
      const lastPage = parsePositiveInt(url.searchParams.get(CULTURE_BE_PAGE_PARAM));
      if (lastPage) return lastPage;
    } catch {
      return 1;
    }
  }

  return 1;
}

function parseListingRows($: cheerio.CheerioAPI, listingUrl: string): ListingJob[] {
  const jobs: ListingJob[] = [];

  $('tr.data-row-1, tr.data-row-2').each((_, element) => {
    const row = $(element);

    const sourceUrl = toAbsoluteUrl(normalizeText(row.find('.col-infos a').attr('href')));
    const parsedUrl = new URL(sourceUrl);
    const uid = parsePositiveInt(parsedUrl.searchParams.get('uid'));
    if (!uid) return;

    const publicationDateRaw = normalizeText(row.find('.col-date_publication span').text());
    const publicationDate = parseCultureBeDate(publicationDateRaw);
    if (!publicationDate) return;

    const postingTypeRaw = normalizeText(row.find('.col-type_poste span').text());
    const contractLabel = normalizeText(row.find('.col-type_contrat span').text()) || null;

    jobs.push({
      uid,
      sourceUrl,
      listingUrl,
      title: normalizeText(row.find('.col-intitule span').text()),
      organization: normalizeText(row.find('.col-employeur span').text()),
      publicationDateRaw,
      publicationDate,
      postingType: parsePostingType(postingTypeRaw),
      contractLabel,
      contractTypes: parseContractTypes(contractLabel ?? ''),
    });
  });

  return jobs;
}

// oxlint-disable-next-line typescript/no-explicit-any
function parseDetailValue(valueElement: any): string {
  const html = valueElement.html();
  if (!html) {
    const textValue = normalizeMultilineText(valueElement.text());
    return textValue ? `<p>${escapeHtmlText(textValue)}</p>` : '';
  }

  return sanitizeDetailHtml(html);
}

function parseDetailFields($: cheerio.CheerioAPI): {
  fields: DetailField[];
  rawDetails: Record<string, Record<string, string>>;
} {
  const root = $('#cfwb_form\\.single').first();
  if (root.length === 0) {
    return { fields: [], rawDetails: {} };
  }

  const fields: DetailField[] = [];
  const rawDetails: Record<string, Record<string, string>> = {};
  let currentSection = 'General';

  root.find('p.single_block, dl.single_element').each((_, element) => {
    const node = $(element);

    if (node.is('p.single_block')) {
      const sectionNode = node.clone();
      sectionNode.find('hr').remove();
      const sectionTitle = normalizeText(sectionNode.text());
      if (sectionTitle) currentSection = sectionTitle;
      return;
    }

    const label = normalizeText(node.find('dt.single_element_label').first().text()).replace(
      /:$/,
      '',
    );
    const valueElement = node.find('dd.single_element_value').first();
    const value = parseDetailValue(valueElement);
    if (!label || !value) return;

    fields.push({ section: currentSection, label, value });
    if (!rawDetails[currentSection]) rawDetails[currentSection] = {};
    rawDetails[currentSection][label] = value;
  });

  return { fields, rawDetails };
}

function findDetailValue(
  fields: DetailField[],
  labelNeedle: string,
  sectionNeedle?: string,
): string | null {
  const normalizedLabelNeedle = normalizeKey(labelNeedle);
  const normalizedSectionNeedle = sectionNeedle ? normalizeKey(sectionNeedle) : null;

  for (const field of fields) {
    if (normalizedSectionNeedle && !normalizeKey(field.section).includes(normalizedSectionNeedle)) {
      continue;
    }
    if (normalizeKey(field.label).includes(normalizedLabelNeedle)) {
      return field.value;
    }
  }

  return null;
}

function parseRequirements(fields: DetailField[]): string | null {
  const profileFields = fields.filter(field => normalizeKey(field.section).includes('profil'));
  if (profileFields.length === 0) return null;

  const preferredLabels = ['Qualifications requises', 'Diplômes', 'Expériences'];
  const preferredParts: string[] = [];

  for (const label of preferredLabels) {
    const value = findDetailValue(profileFields, label);
    if (value) {
      preferredParts.push(`<p><strong>${escapeHtmlText(label)}:</strong></p>${value}`);
    }
  }

  if (preferredParts.length > 0) {
    return preferredParts.join('');
  }

  return profileFields
    .map(field => `<p><strong>${escapeHtmlText(field.label)}:</strong></p>${field.value}`)
    .join('');
}

function parseJobDetail(html: string): ParsedDetail {
  const $ = cheerio.load(html);
  const { fields, rawDetails } = parseDetailFields($);

  const applicationDeadlineRaw = firstNonEmpty(
    normalizeText($('span[id*="date_limite"]').first().text()),
    findDateToken(findDetailValue(fields, 'Candidature', 'Modalités de recrutement') ?? ''),
    findDateToken(findDetailValue(fields, 'Modalité', 'Conditions') ?? ''),
  );

  return {
    location: firstNonEmpty(findDetailValue(fields, 'Coordonnées', 'Organisme employeur')),
    applicationDeadlineRaw,
    applicationDeadline: applicationDeadlineRaw ? parseCultureBeDate(applicationDeadlineRaw) : null,
    jobDescription: firstNonEmpty(findDetailValue(fields, 'Description', 'Fonction')),
    requirements: parseRequirements(fields),
    contractDetails: firstNonEmpty(findDetailValue(fields, 'Type de contrat', 'Conditions')),
    regime: firstNonEmpty(findDetailValue(fields, 'Régime', 'Conditions')),
    applicationInstructions: firstNonEmpty(
      findDetailValue(fields, 'Candidature', 'Modalités de recrutement'),
      findDetailValue(fields, 'Modalité', 'Conditions'),
    ),
    documentsRequired: firstNonEmpty(
      findDetailValue(fields, 'Documents requis', 'Modalités de recrutement'),
    ),
    comments: firstNonEmpty(findDetailValue(fields, 'Commentaires', 'Conditions')),
    employerDescription: firstNonEmpty(
      findDetailValue(fields, 'Description', 'Organisme employeur'),
    ),
    employerSectors: firstNonEmpty(
      findDetailValue(fields, "Secteur(s) d'activité(s)", 'Organisme employeur'),
    ),
    contactDetails: firstNonEmpty(findDetailValue(fields, 'Coordonnées', 'Organisme employeur')),
    moreInfo: firstNonEmpty(findDetailValue(fields, "Plus d'infos", 'Modalités de recrutement')),
    rawDetails: Object.keys(rawDetails).length > 0 ? rawDetails : null,
  };
}

async function fetchCultureBeHtml(url: string): Promise<string> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: REQUEST_HEADERS,
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`culture.be upstream returned ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchListingPage(page: number): Promise<{
  jobs: ListingJob[];
  totalPages: number;
  pageUrl: string;
}> {
  const pageUrl = buildCultureBeJobsUrl(page);
  const html = await fetchCultureBeHtml(pageUrl);
  const $ = cheerio.load(html);

  return {
    jobs: parseListingRows($, pageUrl),
    totalPages: parseTotalPages($),
    pageUrl,
  };
}

async function fetchDetailByListing(listing: ListingJob): Promise<Prisma.JobCreateManyInput> {
  const html = await fetchCultureBeHtml(listing.sourceUrl);
  const detail = parseJobDetail(html);

  return {
    uid: listing.uid,
    source: CULTURE_BE_SOURCE,
    sourceUrl: listing.sourceUrl,
    listingUrl: listing.listingUrl,
    title: listing.title,
    organization: listing.organization,
    publicationDate: listing.publicationDate,
    publicationDateRaw: listing.publicationDateRaw,
    postingType: listing.postingType,
    contractTypes: listing.contractTypes,
    contractLabel: listing.contractLabel,
    location: detail.location,
    applicationDeadline: detail.applicationDeadline,
    applicationDeadlineRaw: detail.applicationDeadlineRaw,
    jobDescription: detail.jobDescription,
    requirements: detail.requirements,
    contractDetails: detail.contractDetails,
    regime: detail.regime,
    applicationInstructions: detail.applicationInstructions,
    documentsRequired: detail.documentsRequired,
    comments: detail.comments,
    employerDescription: detail.employerDescription,
    employerSectors: detail.employerSectors,
    contactDetails: detail.contactDetails,
    moreInfo: detail.moreInfo,
    rawDetails: detail.rawDetails || undefined,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const results: R[] = [];
  let index = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await mapper(items[currentIndex]!);
    }
  });

  await Promise.all(workers);
  return results;
}

function postingTypeToLegacy(postingType: JobPostingType): string {
  if (postingType === 'BENEVOLAT') return 'bénévolat';
  if (postingType === 'EMPLOI') return 'emploi';
  if (postingType === 'STAGE') return 'stage';
  return 'autre';
}

type PersistedJobRecord = Awaited<ReturnType<typeof prisma.job.findMany>>[number];

function mapJobRecordToApiJob(job: PersistedJobRecord): CultureBePersistedJob {
  return {
    id: String(job.uid),
    uid: job.uid,
    link: job.sourceUrl,
    listingUrl: job.listingUrl,
    title: job.title,
    employer: job.organization,
    date: job.publicationDateRaw,
    publicationDate: job.publicationDate.toISOString(),
    contract: job.contractLabel,
    contractTypes: job.contractTypes,
    type: postingTypeToLegacy(job.postingType),
    jobType: job.postingType,
    location: job.location,
    applicationDeadline: job.applicationDeadline?.toISOString() ?? null,
    applicationDeadlineRaw: job.applicationDeadlineRaw,
    jobDescription: job.jobDescription,
    requirements: job.requirements,
    contractDetails: job.contractDetails,
    regime: job.regime,
    applicationInstructions: job.applicationInstructions,
    documentsRequired: job.documentsRequired,
    comments: job.comments,
    employerDescription: job.employerDescription,
    employerSectors: job.employerSectors,
    contactDetails: job.contactDetails,
    moreInfo: job.moreInfo,
    rawDetails: job.rawDetails,
    lastUpdated: job.lastUpdated.toISOString(),
  };
}

export async function listPersistedCultureBeJobs(): Promise<CultureBePersistedJob[]> {
  const jobs = await prisma.job.findMany({
    where: { source: CULTURE_BE_SOURCE },
    orderBy: [{ publicationDate: 'desc' }, { uid: 'desc' }],
  });

  return jobs.map(mapJobRecordToApiJob);
}

export async function getPersistedCultureBeJobByUid(
  uid: number,
): Promise<CultureBePersistedJob | null> {
  const job = await prisma.job.findFirst({
    where: {
      source: CULTURE_BE_SOURCE,
      uid,
    },
  });

  return job ? mapJobRecordToApiJob(job) : null;
}

export async function getCultureBeLastSyncAt(): Promise<string | null> {
  const state = await prisma.jobSyncState.findUnique({
    where: { source: CULTURE_BE_SOURCE },
    select: { lastSyncedAt: true },
  });

  return state?.lastSyncedAt.toISOString() ?? null;
}

export async function syncNewCultureBeJobs(logStep?: StepLogger): Promise<CultureBeSyncSummary> {
  logStep?.info?.('Fetching first culture.be listing page');
  const firstPage = await fetchListingPage(1);
  const totalPages = Math.max(firstPage.totalPages, 1);
  const remainingPages = Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) => i + 2);

  logStep?.info?.('Resolved listing pagination', {
    totalPages,
    firstPageJobs: firstPage.jobs.length,
  });

  const remainingResults = await Promise.all(remainingPages.map(page => fetchListingPage(page)));
  const mergedListings = [...firstPage.jobs, ...remainingResults.flatMap(result => result.jobs)];
  const dedupedListings = Array.from(new Map(mergedListings.map(job => [job.uid, job])).values());

  logStep?.info?.('Listing pages scanned', {
    scannedRows: mergedListings.length,
    dedupedRows: dedupedListings.length,
  });

  const listingUids = dedupedListings.map(job => job.uid);
  const allPersistedJobs = await prisma.job.findMany({
    where: {
      source: CULTURE_BE_SOURCE,
    },
    select: { uid: true },
  });

  const allPersistedUidSet = new Set(allPersistedJobs.map(job => job.uid));
  const existingUidSet = new Set(listingUids.filter(uid => allPersistedUidSet.has(uid)));
  const newListings = dedupedListings.filter(job => !existingUidSet.has(job.uid));
  const listingUidSet = new Set(listingUids);
  const removedUids =
    dedupedListings.length === 0
      ? []
      : Array.from(allPersistedUidSet).filter(uid => !listingUidSet.has(uid));

  logStep?.info?.('Resolved differential ingestion candidates', {
    existing: existingUidSet.size,
    newFound: newListings.length,
    removed: removedUids.length,
  });

  const failedUids: number[] = [];
  const jobsToInsert = (
    await mapWithConcurrency(newListings, MAX_DETAIL_CONCURRENCY, async listing => {
      try {
        return await fetchDetailByListing(listing);
      } catch (error) {
        failedUids.push(listing.uid);
        logStep?.warn?.('Failed to parse job detail page', {
          uid: listing.uid,
          sourceUrl: listing.sourceUrl,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    })
  ).filter((value): value is Prisma.JobCreateManyInput => value !== null);

  const insertResult =
    jobsToInsert.length === 0
      ? { count: 0 }
      : await prisma.job.createMany({
          data: jobsToInsert,
          skipDuplicates: true,
        });

  const deleteResult =
    removedUids.length === 0
      ? { count: 0 }
      : await prisma.job.deleteMany({
          where: {
            source: CULTURE_BE_SOURCE,
            uid: { in: removedUids },
          },
        });

  if (dedupedListings.length === 0 && allPersistedUidSet.size > 0) {
    logStep?.warn?.(
      'Skipping stale culture.be deletion because listing scrape returned zero jobs',
      {
        persistedCount: allPersistedUidSet.size,
      },
    );
  }

  const summary: CultureBeSyncSummary = {
    source: 'culture.be',
    syncedAt: new Date().toISOString(),
    scanned: dedupedListings.length,
    existing: existingUidSet.size,
    newFound: newListings.length,
    inserted: insertResult.count,
    removed: deleteResult.count,
    removedUids,
    failed: failedUids.length,
    failedUids,
  };

  await prisma.jobSyncState.upsert({
    where: { source: CULTURE_BE_SOURCE },
    update: { lastSyncedAt: new Date(summary.syncedAt) },
    create: {
      source: CULTURE_BE_SOURCE,
      lastSyncedAt: new Date(summary.syncedAt),
    },
  });

  logStep?.info?.('Culture.be job sync completed', summary);
  return summary;
}
