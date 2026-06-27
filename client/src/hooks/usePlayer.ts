'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useAppStore } from '@/store';

export function usePlayer() {
  const { currentTrack, isPlaying, volume, setCurrentTrack, setIsPlaying, setVolume } = useAppStore();
  const { emit, on } = useSocket();
  const playerRef = useRef<any>(null);

  // Listen for player sync events
  useEffect(() => {
    const cleanups = [
      on('player:sync', (data: any) => {
        if (data.videoId) {
          setCurrentTrack({
            videoId: data.videoId,
            title: data.title || '',
            thumbnail: data.thumbnail || '',
            channelTitle: data.channelTitle || '',
            duration: data.duration || 0,
            time: data.time || 0,
            isPlaying: data.isPlaying,
          });
          
          // Force immediate seek to prevent lag
          if (playerRef.current && typeof data.time === 'number') {
            const current = playerRef.current.getCurrentTime?.() || 0;
            if (Math.abs(current - data.time) > 1.0) {
              playerRef.current.seekTo?.(data.time, true);
            }
          }
        } else {
          setCurrentTrack(null);
        }
      }),
      on('player:heartbeat', (data: any) => {
        if (!playerRef.current || !data.isPlaying) return;

        // Check drift with latency compensation
        try {
          const currentTime = playerRef.current.getCurrentTime?.() || 0;
          // Calculate network latency (one-way approx)
          const latency = data.timestamp ? (Date.now() - data.timestamp) / 1000 : 0;
          const targetTime = data.time + latency;
          
          const drift = Math.abs(currentTime - targetTime);
          
          // High quality sync: only seek if drift is highly noticeable (>2 seconds)
          if (drift > 2.0) {
            playerRef.current.seekTo?.(targetTime, true);
          } else if (drift > 0.5) {
            // Soft sync: if slightly out of sync, we could adjust playback rate,
            // but YouTube API restricts custom playback rates. 
            // 2 seconds tolerance ensures no stuttering for minor network delays!
          }
        } catch {
          // Player might not be ready
        }
      }),
      on('player:error', (data: any) => {
        console.error('Player error:', data.message);
      }),
    ];

    return () => cleanups.forEach((c) => c());
  }, [on, setCurrentTrack, setIsPlaying]);

  const play = useCallback(
    (track?: any) => {
      if (track) {
        emit('player:play', {
          videoId: track.videoId,
          title: track.title,
          thumbnail: track.thumbnail,
          channelTitle: track.channelTitle,
          duration: track.duration,
          time: 0,
        });
      } else if (currentTrack) {
        emit('player:play', {
          videoId: currentTrack.videoId,
          title: currentTrack.title,
          thumbnail: currentTrack.thumbnail,
          channelTitle: currentTrack.channelTitle,
          duration: currentTrack.duration,
          time: currentTrack.time,
        });
      }
    },
    [emit, currentTrack]
  );

  const pause = useCallback(
    (time?: number) => {
      emit('player:pause', { time: time || 0 });
    },
    [emit]
  );

  const seek = useCallback(
    (time: number) => {
      emit('player:seek', { time });
    },
    [emit]
  );

  const ended = useCallback(() => {
    emit('player:ended');
  }, [emit]);

  return {
    currentTrack,
    isPlaying,
    volume,
    setVolume,
    play,
    pause,
    seek,
    ended,
    playerRef,
  };
}
