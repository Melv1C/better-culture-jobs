import { JobDetailsPage } from '@/features/jobs/components/job-details-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/jobs/$id')({
  component: JobDetailsRoute,
});

function JobDetailsRoute() {
  const { id } = Route.useParams();
  return <JobDetailsPage jobId={id} />;
}
