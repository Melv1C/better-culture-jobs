import {
  Badge,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@melv1c/ui-core';
import type { Log } from '@repo/utils';
import { memo } from 'react';
import { formatDate, levelConfig, typeColors } from '../utils';

interface LogRowProps {
  log: Log;
  onSelect: (id: number) => void;
}

export const LogRow = memo(function LogRow({ log, onSelect }: LogRowProps) {
  const LevelIcon = levelConfig[log.level].icon;
  const levelVariant = levelConfig[log.level].variant;
  const hasDetails = Boolean(log.steps?.length || log.metadata);

  const handleClick = () => {
    if (hasDetails) {
      onSelect(log.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (hasDetails && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(log.id);
    }
  };

  return (
    <TableRow
      className={hasDetails ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={hasDetails ? 0 : -1}
      role={hasDetails ? 'button' : undefined}
      aria-label={hasDetails ? `View details for log: ${log.message}` : undefined}
    >
      <TableCell>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(log.createdAt)}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={levelVariant} className="gap-1 uppercase text-xs">
          <LevelIcon className="h-3 w-3" />
          {log.level}
        </Badge>
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ${typeColors[log.type]}`}
        >
          {log.type}
        </span>
      </TableCell>
      <TableCell>
        <span className="block truncate text-sm max-w-62">{log.message}</span>
      </TableCell>
      <TableCell>
        {log.method ? (
          <Badge variant="outline" className="font-mono text-xs">
            {log.method}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {log.path ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block truncate font-mono text-xs max-w-50">{log.path}</span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-mono text-xs max-w-md break-all">{log.path}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        {log.steps && log.steps.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {log.steps.length}
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
});
