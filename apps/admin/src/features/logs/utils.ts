import type { LogLevel, LogType } from '@repo/utils';
import { AlertCircle, AlertTriangle, Bug, Info } from 'lucide-react';

export const levelConfig: Record<
  LogLevel,
  {
    icon: React.ElementType;
    color: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  debug: { icon: Bug, color: 'text-gray-500', variant: 'secondary' },
  info: { icon: Info, color: 'text-blue-500', variant: 'default' },
  warn: { icon: AlertTriangle, color: 'text-yellow-500', variant: 'outline' },
  error: { icon: AlertCircle, color: 'text-red-500', variant: 'destructive' },
};

export const typeColors: Record<LogType, string> = {
  REQUEST: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  APP: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];
export const LOG_TYPES: LogType[] = ['REQUEST', 'APP'];
export const PAGE_SIZES = [25, 50, 100] as const;

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}
