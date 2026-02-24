import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@melv1c/ui-core';
import { useState } from 'react';
import { useCultureJobs } from '../hooks/use-culture-jobs';

function JobsBoardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
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

export function JobsBoard() {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch, isFetching } = useCultureJobs(page);

  if (isPending) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4">
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
          <AlertDescription>{error instanceof Error ? error.message : 'Erreur inconnue.'}</AlertDescription>
        </Alert>
        <div>
          <Button onClick={() => refetch()}>Réessayer</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offres d&apos;emploi Culture.be</h1>
          <p className="text-sm text-muted-foreground">
            Source: {data.source} • Page {data.pagination.page} / {data.pagination.totalPages}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>

      {data.data.length === 0 ? (
        <Alert>
          <AlertTitle>Aucune offre trouvée</AlertTitle>
          <AlertDescription>Aucune annonce disponible pour cette page.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.data.map(job => (
            <Card key={`${job.id}-${job.link}`} className="h-full">
              <CardHeader className="space-y-2">
                <CardTitle className="leading-snug">{job.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{job.employer}</p>
              </CardHeader>
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{job.type}</Badge>
                  {job.contract && <Badge variant="outline">{job.contract}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">Publié le: {job.date}</p>
                <div className="mt-auto pt-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={job.link} target="_blank" rel="noopener noreferrer">
                      Voir l&apos;offre
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <Button
          variant="outline"
          disabled={!data.pagination.hasPrev || isFetching}
          onClick={() => setPage(currentPage => Math.max(1, currentPage - 1))}
        >
          Précédent
        </Button>
        <p className="text-sm text-muted-foreground">
          Page {data.pagination.page} / {data.pagination.totalPages}
        </p>
        <Button
          variant="outline"
          disabled={!data.pagination.hasNext || isFetching}
          onClick={() => setPage(currentPage => currentPage + 1)}
        >
          Suivant
        </Button>
      </div>
    </section>
  );
}
