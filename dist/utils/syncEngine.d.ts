import type { IRoom } from '../models/Room.js';
/**
 * Calculate the current playback position based on server timestamps.
 * This is the core of our host-authoritative sync model.
 */
export declare function calculateCurrentTime(track: IRoom['currentTrack']): number;
/**
 * Check if a client's time has drifted too far from the server's time.
 * Returns true if resync is needed.
 */
export declare function needsResync(clientTime: number, serverTime: number, threshold?: number): boolean;
/**
 * Build the sync state to broadcast to all clients
 */
export declare function buildSyncState(track: IRoom['currentTrack']): {
    videoId: null;
    time: number;
    isPlaying: boolean;
    title?: undefined;
    thumbnail?: undefined;
    channelTitle?: undefined;
    duration?: undefined;
} | {
    videoId: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    duration: number;
    time: number;
    isPlaying: boolean;
};
//# sourceMappingURL=syncEngine.d.ts.map