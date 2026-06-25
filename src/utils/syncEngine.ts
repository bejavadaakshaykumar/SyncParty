import type { IRoom } from '../models/Room.js';

/**
 * Calculate the current playback position based on server timestamps.
 * This is the core of our host-authoritative sync model.
 */
export function calculateCurrentTime(track: IRoom['currentTrack']): number {
  if (!track) return 0;

  if (!track.isPlaying && track.pausedAt !== undefined) {
    return track.pausedAt;
  }

  if (!track.isPlaying) return 0;

  const elapsed = (Date.now() - track.startedAt) / 1000;
  return Math.min(elapsed, track.duration);
}

/**
 * Check if a client's time has drifted too far from the server's time.
 * Returns true if resync is needed.
 */
export function needsResync(clientTime: number, serverTime: number, threshold = 2.0): boolean {
  return Math.abs(clientTime - serverTime) > threshold;
}

/**
 * Build the sync state to broadcast to all clients
 */
export function buildSyncState(track: IRoom['currentTrack']) {
  if (!track) {
    return { videoId: null, time: 0, isPlaying: false };
  }

  return {
    videoId: track.videoId,
    title: track.title,
    thumbnail: track.thumbnail,
    channelTitle: track.channelTitle,
    duration: track.duration,
    time: calculateCurrentTime(track),
    isPlaying: track.isPlaying,
  };
}
