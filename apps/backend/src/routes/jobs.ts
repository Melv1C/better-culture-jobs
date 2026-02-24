import { zValidator } from '@hono/zod-validator';
import {
  CultureBeJob$,
  CultureBeJobsQuery$,
  CultureBeJobsResponse$,
  type CultureBeJob,
} from '@repo/utils';
import * as cheerio from 'cheerio';
import { Hono } from 'hono';

const CULTURE_BE_ORIGIN = 'https://www.culture.be';
const CULTURE_BE_JOBS_PATH = '/vous-cherchez/emploi-stage/';
const CULTURE_BE_PAGE_PARAM = 'cfwb_form[cfwb_form.list_offre_emploi][page]';
const REQUEST_TIMEOUT_MS = 15000;

function normalizeText(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildCultureBeJobsUrl(page: number): string {
  const url = new URL(CULTURE_BE_JOBS_PATH, CULTURE_BE_ORIGIN);
  if (page > 1) {
    url.searchParams.set(CULTURE_BE_PAGE_PARAM, String(page));
  }
  return url.toString();
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
      // Ignore malformed pagination links and fallback to page indicator/default.
    }
  }

  return 1;
}

function parseJobId(linkHref: string, fallbackId: string): string {
  try {
    const parsedUrl = new URL(linkHref, CULTURE_BE_ORIGIN);
    return parsedUrl.searchParams.get('uid') ?? fallbackId;
  } catch {
    return fallbackId;
  }
}

function toAbsoluteUrl(url: string): string {
  try {
    return new URL(url, CULTURE_BE_ORIGIN).toString();
  } catch {
    return new URL(CULTURE_BE_JOBS_PATH, CULTURE_BE_ORIGIN).toString();
  }
}

function parseJobs($: cheerio.CheerioAPI): CultureBeJob[] {
  const jobs: CultureBeJob[] = [];

  $('tr.data-row-1, tr.data-row-2').each((index, element) => {
    const row = $(element);

    const linkHref = normalizeText(row.find('.col-infos a').attr('href'));
    const absoluteLink = toAbsoluteUrl(linkHref);
    const fallbackId = normalizeText(row.find('.col-infos a').attr('id')) || `row-${index + 1}`;

    const jobCandidate = {
      id: parseJobId(linkHref, fallbackId),
      date: normalizeText(row.find('.col-date_publication span').text()),
      employer: normalizeText(row.find('.col-employeur span').text()),
      title: normalizeText(row.find('.col-intitule span').text()),
      contract: normalizeText(row.find('.col-type_contrat span').text()) || null,
      type: normalizeText(row.find('.col-type_poste span').text()),
      link: absoluteLink,
    };

    const parsedJob = CultureBeJob$.safeParse(jobCandidate);
    if (parsedJob.success) {
      jobs.push(parsedJob.data);
    }
  });

  return jobs;
}

export const jobsRoutes = new Hono().get('/', zValidator('query', CultureBeJobsQuery$), async c => {
  c.get('logStep')?.info('Received request for culture.be jobs', {
    query: c.req.valid('query'),
  });
  const { page } = c.req.valid('query');
  const jobsUrl = buildCultureBeJobsUrl(page);

  // TODO: add short-lived in-memory cache (TTL) for upstream scraper responses.
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    c.get('logStep')?.info('Fetching culture.be jobs', {
      url: jobsUrl,
    });
    const response = await fetch(jobsUrl, {
      headers: {
        'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'user-agent': 'Mozilla/5.0 (compatible; better-culture-jobs/1.0)',
      },
      signal: abortController.signal,
    });

    if (!response.ok) {
      c.get('logStep')?.error('culture.be upstream returned non-OK status', {
        status: response.status,
      });
      throw new Error(`culture.be upstream returned ${response.status}`);
    }

    c.get('logStep')?.info('Received response from culture.be', {
      status: response.status,
    });

    const html = await response.text();
    c.get('logStep')?.info('Parsing culture.be response HTML', {
      length: html.length,
    });
    const $ = cheerio.load(html);

    const data = parseJobs($);
    const totalPages = parseTotalPages($);
    const safeTotalPages = Math.max(totalPages, page);

    c.get('logStep')?.info('Parsed culture.be jobs and pagination', {
      jobsCount: data.length,
      totalPages,
    });

    const parsedResponse = CultureBeJobsResponse$.parse({
      data,
      pagination: {
        page,
        totalPages: safeTotalPages,
        hasPrev: page > 1,
        hasNext: page < safeTotalPages,
      },
      source: 'culture.be',
      fetchedAt: new Date().toISOString(),
    });

    c.get('logStep')?.info('Returning parsed culture.be jobs response', {
      response: parsedResponse,
    });

    return c.json(parsedResponse);
  } catch (error) {
    c.get('logStep')?.error('Failed to fetch culture.be jobs', {
      error: error instanceof Error ? error.message : String(error),
      page,
    });
    return c.json({ error: 'Failed to fetch job offers' }, 502);
  } finally {
    clearTimeout(timeoutId);
  }
});
