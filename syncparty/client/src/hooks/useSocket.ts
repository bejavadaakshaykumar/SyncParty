'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { useAppStore } from '@/store';

export function useSocket() {
  const { token, setIsConnected } = useAppStore();
  const socketRef = useRef(getSocket());

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [token, setIsConnected]);

  const emit = useCallback((event: string, data?: any) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    const socket = getSocket();
    if (socket) {
      socket.on(event, handler);
      return () => {
        socket.off(event, handler);
      };
    }
    return () => {};
  }, []);

  return { emit, on, disconnect: disconnectSocket, socket: socketRef.current };
}
