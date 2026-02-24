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
import type { CultureBeJob } from '@repo/utils';
import {
  BriefcaseBusinessIcon,
  BuildingIcon,
  CalendarIcon,
  ExternalLinkIcon,
  FilterXIcon,
  RefreshCwIcon,
  SearchIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCultureJobs } from '../hooks/use-culture-jobs';

const ALL_FILTER = '__all__';

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
        <div className="mt-auto pt-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={job.link} target="_blank" rel="noopener noreferrer">
              Voir l&apos;offre
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

  return <JobsBoardContent data={data} isFetching={isFetching} refetch={refetch} />;
}

function JobsBoardContent({
  data,
  isFetching,
  refetch,
}: {
  data: { data: CultureBeJob[]; source: string; fetchedAt: string };
  isFetching: boolean;
  refetch: () => void;
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5"
        >
          <RefreshCwIcon className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>

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
