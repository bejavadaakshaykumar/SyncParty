const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('syncparty_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  // Auth
  guestLogin: (username: string) =>
    request<{ token: string; user: any }>('/api/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),

  getMe: () => request<any>('/api/auth/me'),

  updateProfile: (data: { username?: string; avatarUrl?: string }) =>
    request<any>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Rooms
  createRoom: (name: string) =>
    request<any>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getRoom: (roomCode: string) =>
    request<any>(`/api/rooms/${roomCode}`),

  joinRoom: (roomCode: string) =>
    request<any>(`/api/rooms/${roomCode}/join`, {
      method: 'POST',
    }),

  // YouTube
  searchYouTube: (query: string) =>
    request<{ items: any[] }>(`/api/youtube/search?q=${encodeURIComponent(query)}`),

  getVideoDetails: (videoId: string) =>
    request<any>(`/api/youtube/video/${videoId}`),

  // Playlists
  getPlaylists: () => request<any[]>('/api/playlists'),
  
  createPlaylist: (name: string) => 
    request<any>('/api/playlists', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  addTrackToPlaylist: (playlistId: string, track: any) =>
    request<any>(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify(track),
    }),

  removeTrackFromPlaylist: (playlistId: string, trackId: string) =>
    request<any>(`/api/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
    }),

  deletePlaylist: (playlistId: string) =>
    request<any>(`/api/playlists/${playlistId}`, {
      method: 'DELETE',
    }),
};
