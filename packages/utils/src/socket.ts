import { Log, User } from './schemas';

// ============================================
// Socket Event Types
// ============================================

/**
 * Events emitted from the server to clients
 */
export interface ServerToClientEvents {
  connected: (data: { message: string }) => void;
  'log:created': (log: Log) => void;
}

/**
 * Events emitted from clients to the server
 */
export interface ClientToServerEvents {
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

/**
 * Inter-server events (for scaling with multiple servers)
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InterServerEvents {}

/**
 * Data stored per socket connection
 */
export interface SocketData {
  user: User | null;
}

export const getRoomName = {
  logs: 'admin_logs',
};
