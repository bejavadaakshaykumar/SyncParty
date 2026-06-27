import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api';

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPlaylists();
      setPlaylists(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const createPlaylist = async (name: string) => {
    try {
      const newPlaylist = await api.createPlaylist(name);
      setPlaylists((prev) => [newPlaylist, ...prev]);
      return newPlaylist;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const addTrack = async (playlistId: string, track: any) => {
    try {
      const updatedPlaylist = await api.addTrackToPlaylist(playlistId, track);
      setPlaylists((prev) => prev.map((p) => (p._id === playlistId ? updatedPlaylist : p)));
      return updatedPlaylist;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const removeTrack = async (playlistId: string, trackId: string) => {
    try {
      const updatedPlaylist = await api.removeTrackFromPlaylist(playlistId, trackId);
      setPlaylists((prev) => prev.map((p) => (p._id === playlistId ? updatedPlaylist : p)));
      return updatedPlaylist;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      await api.deletePlaylist(playlistId);
      setPlaylists((prev) => prev.filter((p) => p._id !== playlistId));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return {
    playlists,
    loading,
    error,
    fetchPlaylists,
    createPlaylist,
    addTrack,
    removeTrack,
    deletePlaylist,
  };
}
