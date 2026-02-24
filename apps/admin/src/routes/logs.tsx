import { LogDetailSheet, LogsFilter, LogsTable } from '@/features/logs';
import { useSocket } from '@/features/socket';
import { getRoomName } from '@repo/utils';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

function LogsPage() {
  // Subscribe to real-time log updates
  const { socket } = useSocket();

  useEffect(() => {
    socket.emit('joinRoom', getRoomName.logs);

    return () => {
      socket.emit('leaveRoom', getRoomName.logs);
    };
  }, [socket]);

  return (
    <>
      <LogsFilter />
      <LogsTable />
      <LogDetailSheet />
    </>
  );
}

export const Route = createFileRoute('/logs')({
  component: LogsPage,
});
