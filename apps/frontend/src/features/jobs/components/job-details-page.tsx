import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from '@melv1c/ui-core';
import type { CultureBeJob } from '@repo/utils';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  BriefcaseBusinessIcon,
  BuildingIcon,
  CalendarIcon,
  ClipboardListIcon,
  Clock3Icon,
  ExternalLinkIcon,
  FileTextIcon,
  InfoIcon,
  MapPinIcon,
  ScrollTextIcon,
  SendIcon,
  UserCheckIcon,
} from 'lucide-react';
import { memo, useMemo, type ReactNode } from 'react';
import { useCultureJob } from '../hooks/use-culture-jobs';
import { getDeadlineInfo, type DeadlineStatus } from '../utils/deadline';

function hasContent(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function formatJobTypeLabel(type: string): string {
  if (type === 'emploi') return 'Emploi';
  if (type === 'stage') return 'Stage';
  if (type === 'bénévolat') return 'Bénévolat';
  return type;
}

// Hoisted static icon JSX — never re-created on render (rendering-hoist-jsx)
const ICON_PUBLICATION = <CalendarIcon aria-hidden="true" className="size-4" />;
const ICON_DEADLINE = <Clock3Icon aria-hidden="true" className="size-4" />;
const ICON_LOCATION = <MapPinIcon aria-hidden="true" className="size-4" />;

const DEADLINE_PILL_VARIANTS: Record<DeadlineStatus, string> = {
  unknown: 'border bg-background/70',
  ok: 'border bg-background/70',
  soon: 'border-yellow-300 bg-yellow-50/60 dark:border-yellow-700 dark:bg-yellow-950/20',
  near: 'border-amber-400 bg-amber-50/70 dark:border-amber-700 dark:bg-amber-950/20',
  urgent: 'border-red-400 bg-red-50/70 dark:border-red-700 dark:bg-red-950/20',
  expired: 'border-red-400 bg-red-50/70 dark:border-red-700 dark:bg-red-950/20',
};

const DEADLINE_BADGE_LABEL: Partial<Record<DeadlineStatus, string>> = {
  expired: 'Expiré',
  urgent: 'Urgent',
  near: 'Bientôt',
  soon: 'Dans 2 sem.',
};

type SectionVariant = 'description' | 'requirements' | 'contract' | 'apply';

const SECTION_META: Record<SectionVariant, { icon: ReactNode; accent: string; headerBg: string }> =
  {
    description: {
      icon: <ClipboardListIcon aria-hidden="true" className="size-4" />,
      accent: 'border-l-blue-500',
      headerBg: 'bg-blue-50/60 dark:bg-blue-950/20',
    },
    requirements: {
      icon: <UserCheckIcon aria-hidden="true" className="size-4" />,
      accent: 'border-l-emerald-500',
      headerBg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    },
    contract: {
      icon: <ScrollTextIcon aria-hidden="true" className="size-4" />,
      accent: 'border-l-amber-500',
      headerBg: 'bg-amber-50/60 dark:bg-amber-950/20',
    },
    apply: {
      icon: <SendIcon aria-hidden="true" className="size-4" />,
      accent: 'border-l-violet-500',
      headerBg: 'bg-violet-50/60 dark:bg-violet-950/20',
    },
  };

const HtmlContent = memo(function HtmlContent({ html }: { html: string }) {
  return (
    <div
      className="text-sm leading-relaxed [&_a]:underline [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

const SectionCard = memo(function SectionCard({
  title,
  description,
  content,
  variant,
}: {
  title: string;
  description: string;
  content: string;
  variant: SectionVariant;
}) {
  const { icon, accent, headerBg } = SECTION_META[variant];
  return (
    <Card className={`overflow-hidden border-l-4 ${accent}`}>
      <CardHeader className={`pb-3 ${headerBg}`}>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="pt-4">
        <HtmlContent html={content} />
      </CardContent>
    </Card>
  );
});

function JobDetailsSkeleton() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
      <Skeleton className="h-9 w-40" />
      <Card>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </section>
  );
}

export function JobDetailsPage({ jobId }: { jobId: string }) {
  const { data, isPending, isError, error } = useCultureJob(jobId);

  if (isPending) return <JobDetailsSkeleton />;

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
        <Button asChild variant="ghost" className="w-fit gap-1.5">
          <Link to="/">
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            Retour aux offres
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Impossible de charger cette offre</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Erreur inconnue.'}
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return <JobDetailsContent job={data} />;
}

function JobDetailsContent({ job }: { job: CultureBeJob }) {
  // useMemo for stable derived values (rerender-memo)
  const publicationDate = useMemo(
    () => formatDate(job.publicationDate) ?? job.date,
    [job.publicationDate, job.date],
  );
  const applicationDeadline = useMemo(
    () => formatDate(job.applicationDeadline) ?? job.applicationDeadlineRaw,
    [job.applicationDeadline, job.applicationDeadlineRaw],
  );

  const deadlineInfo = useMemo(
    () => getDeadlineInfo(job.applicationDeadline),
    [job.applicationDeadline],
  );

  const hasAdditionalInfo =
    hasContent(job.documentsRequired) ||
    hasContent(job.comments) ||
    hasContent(job.employerDescription) ||
    hasContent(job.moreInfo);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
      {/* Navigation bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" className="w-fit gap-1.5">
          <Link to="/">
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            Retour aux offres
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-fit gap-1.5">
          <a href={job.link} target="_blank" rel="noopener noreferrer">
            Voir l&apos;offre originale
            <ExternalLinkIcon aria-hidden="true" className="size-4" />
          </a>
        </Button>
      </div>

      {/* Hero card */}
      <Card className="overflow-hidden border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BriefcaseBusinessIcon aria-hidden="true" className="size-5" />
            {job.title}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{formatJobTypeLabel(job.type)}</Badge>
            {hasContent(job.employer) ? (
              <>
                <BuildingIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{job.employer}</span>
              </>
            ) : null}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="grid gap-3 p-5 md:grid-cols-3">
          <InfoPill icon={ICON_PUBLICATION} label="Publication" value={publicationDate} />
          <InfoPill
            icon={ICON_DEADLINE}
            label="Date limite"
            value={applicationDeadline ?? 'Non précisée'}
            deadlineStatus={deadlineInfo.status}
            daysLeft={deadlineInfo.daysLeft}
          />
          <InfoPill
            icon={ICON_LOCATION}
            label="Lieu"
            value={job.location ?? 'Non précisé'}
            isHtml={!!job.location}
          />
        </CardContent>
      </Card>

      {/* Main content sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {hasContent(job.jobDescription) ? (
          <SectionCard
            variant="description"
            title="Description du poste"
            description="Missions et responsabilités principales."
            content={job.jobDescription}
          />
        ) : null}

        {hasContent(job.requirements) ? (
          <SectionCard
            variant="requirements"
            title="Profil recherché"
            description="Compétences et expérience demandées."
            content={job.requirements}
          />
        ) : null}

        {hasContent(job.contractDetails) ? (
          <SectionCard
            variant="contract"
            title="Conditions du contrat"
            description="Type de contrat et modalités pratiques."
            content={job.contractDetails}
          />
        ) : null}

        {hasContent(job.applicationInstructions) ? (
          <SectionCard
            variant="apply"
            title="Comment postuler"
            description="Étapes pour envoyer la candidature."
            content={job.applicationInstructions}
          />
        ) : null}
      </div>

      {/* Additional info */}
      {hasAdditionalInfo ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <InfoIcon aria-hidden="true" className="size-4 text-muted-foreground" />
              Informations complémentaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {hasContent(job.documentsRequired) ? (
              <DetailRow label="Documents requis" value={job.documentsRequired} />
            ) : null}
            {hasContent(job.comments) ? (
              <DetailRow label="Commentaires" value={job.comments} />
            ) : null}
            {hasContent(job.employerDescription) ? (
              <>
                <Separator />
                <DetailRow label="À propos de l'organisme" value={job.employerDescription} />
              </>
            ) : null}
            {hasContent(job.moreInfo) ? (
              <DetailRow label="Plus d'infos" value={job.moreInfo} />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Source disclaimer */}
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <FileTextIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              Les informations ci-dessus sont synchronisées depuis culture.be. Vérifiez toujours la
              version source avant d&apos;envoyer votre candidature.
            </p>
          </div>
          <Button asChild className="shrink-0 gap-1.5">
            <a href={job.link} target="_blank" rel="noopener noreferrer">
              Ouvrir la source officielle
              <ExternalLinkIcon aria-hidden="true" className="size-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

const InfoPill = memo(function InfoPill({
  icon,
  label,
  value,
  deadlineStatus,
  daysLeft,
  isHtml,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  deadlineStatus?: DeadlineStatus;
  daysLeft?: number | null;
  isHtml?: boolean;
}) {
  const containerClass = deadlineStatus
    ? DEADLINE_PILL_VARIANTS[deadlineStatus]
    : 'border bg-background/70';
  const badgeLabel = deadlineStatus ? DEADLINE_BADGE_LABEL[deadlineStatus] : undefined;
  const badgeClass =
    deadlineStatus === 'expired' || deadlineStatus === 'urgent'
      ? 'rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white'
      : deadlineStatus === 'near'
        ? 'rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white'
        : deadlineStatus === 'soon'
          ? 'rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-black'
          : undefined;
  const daysLabel =
    deadlineStatus === 'urgent' && daysLeft != null
      ? daysLeft === 0
        ? "Aujourd'hui"
        : `J-${daysLeft}`
      : deadlineStatus === 'near' && daysLeft != null
        ? `J-${daysLeft}`
        : undefined;

  return (
    <div className={`rounded-lg p-3 ${containerClass}`}>
      <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
        {icon}
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {isHtml ? (
          <HtmlContent html={value} />
        ) : (
          <p className="text-sm font-medium leading-snug">{value}</p>
        )}
        {badgeClass && badgeLabel && <span className={badgeClass}>{daysLabel ?? badgeLabel}</span>}
      </div>
    </div>
  );
});

const DetailRow = memo(function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <HtmlContent html={value} />
    </div>
  );
});
