export interface User {
  id: string;
  username: string;
  avatarColor: string;
  avatarUrl: string;
  isGuest: boolean;
  favorites?: string[];
  recentlyPlayed?: RecentTrack[];
}

export interface RecentTrack {
  videoId: string;
  title: string;
  thumbnail: string;
  playedAt: string;
}

export interface Track {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: number;
}

export interface QueueItem extends Track {
  addedBy: string;
  addedByUsername: string;
  votes: number;
  skipVotes: string[];
}

export interface CurrentTrack extends Track {
  time: number;
  isPlaying: boolean;
}

export interface Participant {
  userId: string;
  username: string;
  avatarColor: string;
  joinedAt: string;
  isOnline: boolean;
}

export interface RoomSettings {
  allowGuestQueue: boolean;
  voteToSkipThreshold: number;
  maxQueueSize: number;
}

export interface Room {
  roomCode: string;
  name: string;
  hostId: string;
  participants: Participant[];
  currentTrack: CurrentTrack | null;
  queue: QueueItem[];
  history: Track[];
  settings: RoomSettings;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatarColor: string;
  content: string;
  type: 'text' | 'emoji' | 'system';
  mentions: string[];
  createdAt: string;
}

export interface SearchResult extends Track {}

export type PlayerState = 'idle' | 'playing' | 'paused' | 'buffering';
