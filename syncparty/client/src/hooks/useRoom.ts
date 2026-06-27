'use client';

import { useEffect, useCallback, useState } from 'react';
import { useSocket } from './useSocket';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Room } from '@/types';

export function useRoom() {
  const { room, setRoom, setCurrentTrack, setQueue, setMessages, updateParticipants } = useAppStore();
  const { emit, on } = useSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for room events
  useEffect(() => {
    const cleanups = [
      on('room:state', (data: Room) => {
        setRoom(data);
        if (data.currentTrack) setCurrentTrack(data.currentTrack);
        if (data.queue) setQueue(data.queue);
      }),
      on('room:user-joined', (data: any) => {
        if (room) {
          const updated = [...room.participants, { ...data, isOnline: true, joinedAt: new Date().toISOString() }];
          updateParticipants(updated);
        }
      }),
      on('room:user-left', (data: any) => {
        if (room) {
          const updated = room.participants.map((p) =>
            p.userId === data.userId ? { ...p, isOnline: false } : p
          );
          updateParticipants(updated);
        }
      }),
      on('room:error', (data: any) => {
        setError(data.message);
      }),
      on('room:settings-updated', (data: any) => {
        if (room) {
          setRoom({ ...room, settings: data.settings });
        }
      }),
    ];

    return () => cleanups.forEach((c) => c());
  }, [on, room, setRoom, setCurrentTrack, setQueue, updateParticipants]);

  const createRoom = useCallback(
    async (name: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.createRoom(name);
        emit('room:join', { roomCode: data.roomCode });
        return data.roomCode;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [emit]
  );

  const joinRoom = useCallback(
    async (roomCode: string) => {
      setLoading(true);
      setError(null);
      try {
        await api.joinRoom(roomCode);
        emit('room:join', { roomCode: roomCode.toUpperCase() });
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [emit]
  );

  const leaveRoom = useCallback(() => {
    if (room) {
      emit('room:leave', { roomCode: room.roomCode });
      setRoom(null);
      setMessages([]);
      setQueue([]);
      setCurrentTrack(null);
    }
  }, [room, emit, setRoom, setMessages, setQueue, setCurrentTrack]);

  const isHost = room?.hostId === useAppStore.getState().user?.id;

  const updateSettings = useCallback(
    (settings: Partial<Room['settings']>) => {
      if (isHost && room) {
        // Optimistic update
        setRoom({ ...room, settings: { ...room.settings, ...settings } });
        emit('room:update-settings', { settings });
      }
    },
    [isHost, room, setRoom, emit]
  );

  return { room, loading, error, createRoom, joinRoom, leaveRoom, updateSettings, isHost };
}
