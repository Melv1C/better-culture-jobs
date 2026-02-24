import { useAPIHealth } from '@/hooks/use-api-health';
import { env } from '@/lib/env';
import { CardHealth, Logo } from '@repo/ui';
import { APP_NAME, APP_VERSION } from '@repo/utils';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { isPending, isError, refetch } = useAPIHealth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 p-4">
      <Logo />
      <h1 className="text-3xl font-bold">
        Welcome to {APP_NAME} v{APP_VERSION}
      </h1>
      <p className="text-gray-700">Environment: {env.VITE_NODE_ENV}</p>
      <div className="mt-4">
        <CardHealth className="w-64" isPending={isPending} isError={isError} refetch={refetch} />
      </div>
    </div>
  );
}
