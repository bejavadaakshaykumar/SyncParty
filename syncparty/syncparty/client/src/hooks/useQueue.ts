'use client';

import { useEffect, useCallback, useState } from 'react';
import { useSocket } from './useSocket';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Track, QueueItem, SearchResult } from '@/types';

export function useQueue() {
  const { queue, setQueue } = useAppStore();
  const { emit, on } = useSocket();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Listen for queue updates
  useEffect(() => {
    const cleanup = on('queue:update', (data: { queue: QueueItem[] }) => {
      setQueue(data.queue);
    });

    return cleanup;
  }, [on, setQueue]);

  const addTrack = useCallback(
    (track: Track) => {
      emit('queue:add', { track });
    },
    [emit]
  );

  const removeTrack = useCallback(
    (index: number) => {
      emit('queue:remove', { index });
    },
    [emit]
  );

  const reorderQueue = useCallback(
    (from: number, to: number) => {
      emit('queue:reorder', { from, to });
    },
    [emit]
  );

  const voteToSkip = useCallback(() => {
    emit('queue:skip-vote');
  }, [emit]);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const data = await api.searchYouTube(query);
      setSearchResults(data.items || []);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    queue,
    searchResults,
    searching,
    addTrack,
    removeTrack,
    reorderQueue,
    voteToSkip,
    search,
    clearSearch,
  };
}
