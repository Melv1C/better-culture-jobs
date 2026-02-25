import { JobsBoard } from '@/features/jobs/components/jobs-board';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return <JobsBoard />;
}
