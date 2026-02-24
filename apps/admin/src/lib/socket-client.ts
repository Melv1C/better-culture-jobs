import type { ClientToServerEvents, ServerToClientEvents } from '@repo/utils';
import { io, Socket } from 'socket.io-client';
import { env } from './env';

// Type-safe socket client
export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Singleton socket instance
let socket: TypedSocket | null = null;

/**
 * Get the socket instance, creating it if necessary
 */
export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(env.VITE_BACKEND_URL, {
      autoConnect: false,
      withCredentials: true,
      reconnectionAttempts: 5,
    });

    // Log connection events in development
    if (env.VITE_NODE_ENV === 'development') {
      socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket?.id);
      });

      socket.on('disconnect', reason => {
        console.log('🔌 Socket disconnected:', reason);
      });

      socket.on('connect_error', error => {
        console.error('🔌 Socket connection error:', error.message);
      });
    }
  }

  return socket;
}

/**
 * Connect the socket if not already connected
 */
export function connectSocket(): TypedSocket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

/**
 * Disconnect the socket
 */
export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
