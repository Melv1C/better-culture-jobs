import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@melv1c/ui-core';
import { AlertCircle, ChevronLeft, ChevronRight, Info, Loader2 } from 'lucide-react';
import { useLogs } from '../hooks/use-logs';
import { useLogsStore } from '../logs-store';
import { LogRow } from './log-row';

export function LogsTable() {
  const filter = useLogsStore(state => state.filter);
  const { data, isPending, isError } = useLogs(filter);

  const updateFilter = useLogsStore(state => state.updateFilter);
  const setSelectedLogId = useLogsStore(state => state.setSelectedLogId);
  const setSheetOpen = useLogsStore(state => state.setSheetOpen);

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  const handleSelectLog = (id: number) => {
    setSelectedLogId(id);
    setSheetOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs</CardTitle>
        <CardDescription>Click on a row to view full details</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading logs...</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-12 text-destructive gap-3">
            <AlertCircle className="h-8 w-8" />
            <div className="text-center">
              <p className="text-sm font-medium">Failed to load logs</p>
              <p className="text-xs text-muted-foreground mt-1">Please try again later</p>
            </div>
          </div>
        )}

        {!isPending && !isError && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <Info className="h-8 w-8" />
            <div className="text-center">
              <p className="text-sm font-medium">No logs found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          </div>
        )}

        {!isPending && !isError && logs.length > 0 && (
          <div className="space-y-4">
            <ScrollArea className="h-125">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-35">Time</TableHead>
                    <TableHead className="w-25">Level</TableHead>
                    <TableHead className="w-22">Type</TableHead>
                    <TableHead className="min-w-62">Message</TableHead>
                    <TableHead className="w-22">Method</TableHead>
                    <TableHead className="min-w-50">Path</TableHead>
                    <TableHead className="w-18 text-center">Steps</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <LogRow key={log.id} log={log} onSelect={handleSelectLog} />
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <p className="text-xs">
                Showing {logs.length} of {pagination.total} total logs
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => updateFilter({ page: pagination.page - 1 })}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateFilter({ page: pagination.page + 1 })}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
