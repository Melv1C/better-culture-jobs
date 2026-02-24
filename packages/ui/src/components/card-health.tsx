import { Button, Card, CardContent, CardHeader, CardTitle } from '@melv1c/ui-core';
import { Activity, CheckCircle, RefreshCw, Server, XCircle } from 'lucide-react';

type CardHealthProps = React.ComponentProps<typeof Card> & {
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
};

export const CardHealth = ({ isPending, isError, refetch, ...props }: CardHealthProps) => {
  return (
    <Card {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Backend Status</CardTitle>
        <Server className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <Activity className="h-4 w-4 animate-pulse" />
                <span className="text-sm text-muted-foreground">Checking...</span>
              </>
            )}
            {isError && (
              <>
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">Offline</span>
              </>
            )}
            {!isPending && !isError && (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">Online</span>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isPending}
            title="Retry connection"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
