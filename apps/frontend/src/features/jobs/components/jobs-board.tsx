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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
} from '@melv1c/ui-core';
import type { CultureBeJob, CultureBeJobSyncResponse } from '@repo/utils';
import { Link } from '@tanstack/react-router';
import {
  ArrowRightIcon,
  BriefcaseBusinessIcon,
  BuildingIcon,
  CalendarIcon,
  Clock3Icon,
  ExternalLinkIcon,
  FilterXIcon,
  MapPinIcon,
  RefreshCwIcon,
  SearchIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCultureJobs, useSyncCultureJobs } from '../hooks/use-culture-jobs';
import { getDeadlineInfo, type DeadlineInfo } from '../utils/deadline';

const ALL_FILTER = '__all__';

function formatLastSyncDateTime(value: string | null): string {
  if (!value) return 'Jamais';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Jamais';

  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function DeadlineBadge({ status, daysLeft }: DeadlineInfo) {
  if (status === 'ok' || status === 'unknown') return null;
  if (status === 'expired')
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        Expiré
      </Badge>
    );
  const label = `J-${daysLeft}`;
  if (status === 'urgent')
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        {label}
      </Badge>
    );
  if (status === 'near')
    return (
      <Badge className="gap-1 bg-amber-500 text-xs text-white hover:bg-amber-500">{label}</Badge>
    );
  return (
    <Badge className="gap-1 bg-yellow-400 text-xs text-black hover:bg-yellow-400">{label}</Badge>
  );
}

function JobsBoardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <Card key={`jobs-skeleton-${index}`}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-9 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function useJobFilters(jobs: CultureBeJob[]) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(ALL_FILTER);
  const [contractFilter, setContractFilter] = useState(ALL_FILTER);

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const job of jobs) {
      set.add(job.type);
    }
    return Array.from(set).sort();
  }, [jobs]);

  const contracts = useMemo(() => {
    const set = new Set<string>();
    for (const job of jobs) {
      if (job.contract) set.add(job.contract);
    }
    return Array.from(set).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    const result: CultureBeJob[] = [];

    for (const job of jobs) {
      if (typeFilter !== ALL_FILTER && job.type !== typeFilter) continue;
      if (contractFilter !== ALL_FILTER && job.contract !== contractFilter) continue;
      if (
        normalizedSearch &&
        !job.title.toLowerCase().includes(normalizedSearch) &&
        !job.employer.toLowerCase().includes(normalizedSearch)
      ) {
        continue;
      }
      result.push(job);
    }

    return result;
  }, [jobs, search, typeFilter, contractFilter]);

  const hasActiveFilters =
    search !== '' || typeFilter !== ALL_FILTER || contractFilter !== ALL_FILTER;

  const resetFilters = () => {
    setSearch('');
    setTypeFilter(ALL_FILTER);
    setContractFilter(ALL_FILTER);
  };

  return {
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    contractFilter,
    setContractFilter,
    types,
    contracts,
    filteredJobs,
    hasActiveFilters,
    resetFilters,
  };
}

function JobCard({ job }: { job: CultureBeJob }) {
  return (
    <Card className="group flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader className="space-y-1.5 pb-3">
        <CardTitle className="text-base leading-snug">{job.title}</CardTitle>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <BuildingIcon className="size-3.5 shrink-0" />
          <span className="leading-snug">{job.employer}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="gap-1">
            <BriefcaseBusinessIcon className="size-3" />
            {job.type}
          </Badge>
          {job.contract && <Badge variant="outline">{job.contract}</Badge>}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarIcon className="size-3 shrink-0" />
          <span>{job.date}</span>
        </div>
        {job.location && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPinIcon className="mt-0.5 size-3 shrink-0" />
            <span className="line-clamp-2">{job.location}</span>
          </div>
        )}
        {job.applicationDeadlineRaw && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3Icon className="size-3 shrink-0" />
            <span>Date limite: {job.applicationDeadlineRaw}</span>
            <DeadlineBadge {...getDeadlineInfo(job.applicationDeadline)} />
          </div>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/jobs/$id" params={{ id: job.id }}>
              Voir les détails
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={job.link} target="_blank" rel="noopener noreferrer">
              Source
              <ExternalLinkIcon className="size-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function JobsBoard() {
  const { data, isPending, isError, error, refetch, isFetching } = useCultureJobs();
  const {
    mutateAsync: syncJobs,
    isPending: isSyncing,
    data: syncResult,
    error: syncError,
  } = useSyncCultureJobs();

  const handleRefresh = async () => {
    await syncJobs();
    await refetch();
  };

  if (isPending) {
    return (
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4">
        <div>
          <h1 className="text-3xl font-bold">Offres d&apos;emploi Culture.be</h1>
          <p className="text-sm text-muted-foreground">Chargement des annonces en cours...</p>
        </div>
        <JobsBoardSkeleton />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
        <h1 className="text-3xl font-bold">Offres d&apos;emploi Culture.be</h1>
        <Alert variant="destructive">
          <AlertTitle>Impossible de charger les offres</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Erreur inconnue.'}
          </AlertDescription>
        </Alert>
        <div>
          <Button onClick={() => refetch()}>Réessayer</Button>
        </div>
      </section>
    );
  }

  return (
    <JobsBoardContent
      data={data}
      isFetching={isFetching}
      isSyncing={isSyncing}
      syncResult={syncResult}
      syncError={syncError}
      onRefresh={handleRefresh}
    />
  );
}

function JobsBoardContent({
  data,
  isFetching,
  isSyncing,
  syncResult,
  syncError,
  onRefresh,
}: {
  data: { data: CultureBeJob[]; source: string; fetchedAt: string; lastSyncedAt: string | null };
  isFetching: boolean;
  isSyncing: boolean;
  syncResult?: CultureBeJobSyncResponse;
  syncError: Error | null;
  onRefresh: () => Promise<void>;
}) {
  const {
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    contractFilter,
    setContractFilter,
    types,
    contracts,
    filteredJobs,
    hasActiveFilters,
    resetFilters,
  } = useJobFilters(data.data);
  const isRefreshing = isFetching || isSyncing;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offres d&apos;emploi Culture.be</h1>
          <p className="text-sm text-muted-foreground">
            {data.data.length} offre{data.data.length > 1 ? 's' : ''} disponible
            {data.data.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <p className="text-xs text-muted-foreground">
            Dernière synchro: {formatLastSyncDateTime(data.lastSyncedAt)}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void onRefresh()}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCwIcon className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation...' : isFetching ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
      </div>

      {syncError && (
        <Alert variant="destructive">
          <AlertTitle>Synchronisation échouée</AlertTitle>
          <AlertDescription>{syncError.message}</AlertDescription>
        </Alert>
      )}

      {syncResult && !syncError && (
        <Alert>
          <AlertTitle>Synchronisation terminée</AlertTitle>
          <AlertDescription>
            {syncResult.inserted} nouvelle{syncResult.inserted > 1 ? 's' : ''} offre
            {syncResult.inserted > 1 ? 's' : ''} ajoutée{syncResult.inserted > 1 ? 's' : ''} (
            {syncResult.scanned} annonces scannées).
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre ou employeur..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Type de poste" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>Tous les types</SelectItem>
              {types.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={contractFilter} onValueChange={setContractFilter}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Type de contrat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>Tous les contrats</SelectItem>
              {contracts.map(contract => (
                <SelectItem key={contract} value={contract}>
                  {contract}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={resetFilters}
              title="Réinitialiser les filtres"
            >
              <FilterXIcon className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results info */}
      {hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          {filteredJobs.length} résultat{filteredJobs.length > 1 ? 's' : ''} sur {data.data.length}{' '}
          offre{data.data.length > 1 ? 's' : ''}
        </p>
      )}

      {/* Job grid */}
      {filteredJobs.length === 0 ? (
        <Alert>
          <AlertTitle>Aucune offre trouvée</AlertTitle>
          <AlertDescription>
            {hasActiveFilters
              ? 'Aucune annonce ne correspond à vos critères. Essayez de modifier vos filtres.'
              : 'Aucune annonce disponible pour le moment.'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map(job => (
            <JobCard key={`${job.id}-${job.link}`} job={job} />
          ))}
        </div>
      )}
    </section>
  );
}
