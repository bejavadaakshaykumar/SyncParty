import { create } from 'zustand';
import type { User, Room, CurrentTrack, QueueItem, ChatMessage } from '@/types';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;

  // Room
  room: Room | null;
  setRoom: (room: Room | null) => void;
  updateParticipants: (participants: Room['participants']) => void;

  // Player
  currentTrack: CurrentTrack | null;
  isPlaying: boolean;
  volume: number;
  setCurrentTrack: (track: CurrentTrack | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;

  // Queue
  queue: QueueItem[];
  setQueue: (queue: QueueItem[]) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  typingUsers: string[];
  setTypingUsers: (users: string[]) => void;

  // UI
  activePanel: 'queue' | 'chat';
  setActivePanel: (panel: 'queue' | 'chat') => void;
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('syncparty_token', token);
    } else {
      localStorage.removeItem('syncparty_token');
    }
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('syncparty_token');
    set({ user: null, token: null, room: null, messages: [], queue: [] });
  },

  // Room
  room: null,
  setRoom: (room) => set({ room }),
  updateParticipants: (participants) =>
    set((state) => ({
      room: state.room ? { ...state.room, participants } : null,
    })),

  // Player
  currentTrack: null,
  isPlaying: false,
  volume: 80,
  setCurrentTrack: (track) =>
    set({ currentTrack: track, isPlaying: track?.isPlaying ?? false }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume }),

  // Queue
  queue: [],
  setQueue: (queue) => set({ queue }),

  // Chat
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages.slice(-200), message],
    })),
  setMessages: (messages) => set({ messages }),
  typingUsers: [],
  setTypingUsers: (users) => set({ typingUsers: users }),

  // UI
  activePanel: 'queue',
  setActivePanel: (panel) => set({ activePanel: panel }),
  isConnected: false,
  setIsConnected: (connected) => set({ isConnected: connected }),
}));
