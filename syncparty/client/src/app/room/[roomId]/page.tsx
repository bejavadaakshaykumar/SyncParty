'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useRoom } from '@/hooks/useRoom';
import { usePlayer } from '@/hooks/usePlayer';
import { useQueue } from '@/hooks/useQueue';
import { useChat } from '@/hooks/useChat';
import { useSocket } from '@/hooks/useSocket';
import { useAppStore } from '@/store';
import { formatDuration, getInitials, timeAgo } from '@/lib/utils';
import {
  HiPlay, HiPause, HiForward, HiBackward, HiSpeakerWave, HiSpeakerXMark,
  HiMagnifyingGlass, HiXMark, HiPlusCircle, HiTrash, HiArrowLeft,
  HiClipboard, HiMusicalNote, HiChatBubbleLeftRight, HiQueueList,
  HiUserGroup, HiCog6Tooth, HiHandThumbUp, HiPaperAirplane, HiFaceSmile,
  HiArrowRightOnRectangle, HiCheck, HiSignal
} from 'react-icons/hi2';

type PageProps = {
  params: Promise<{ roomId: string }>;
};

export default function RoomPage({ params }: PageProps) {
  const { roomId } = use(params);
  const router = useRouter();
  const { user, checkAuth } = useAuth();
  const { room, joinRoom, leaveRoom, isHost, updateSettings } = useRoom();
  const { currentTrack, isPlaying, volume, setVolume, play, pause, seek, ended, playerRef } = usePlayer();
  const { queue, searchResults, searching, addTrack, removeTrack, reorderQueue, voteToSkip, search, clearSearch } = useQueue();
  const { messages, typingUsers, sendMessage, sendTyping } = useChat();
  const { emit, on } = useSocket();
  const { activePanel, setActivePanel, isConnected } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(80);
  const [playerReady, setPlayerReady] = useState(false);

  // Auth check
  useEffect(() => {
    const init = async () => {
      const authed = await checkAuth();
      if (!authed) {
        router.push('/');
        return;
      }
      await joinRoom(roomId);
      setLoading(false);
    };
    init();
  }, [roomId]);

  // YouTube Player
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      setPlayerReady(true);
    };

    if ((window as any).YT?.Player) {
      setPlayerReady(true);
    }

    return () => {
      tag.remove();
    };
  }, []);

  // Initialize YT player when ready and track changes
  useEffect(() => {
    if (!playerReady || !currentTrack?.videoId) return;

    const YT = (window as any).YT;
    if (!YT?.Player) return;

    // Destroy existing player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {}
    }

    const player = new YT.Player('yt-player', {
      width: '100%',
      height: '100%',
      videoId: currentTrack.videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        start: Math.floor(currentTrack.time || 0),
      },
      events: {
        onReady: (event: any) => {
          playerRef.current = event.target;
          event.target.setVolume(volume);
          if (currentTrack.isPlaying) {
            event.target.playVideo();
            if (currentTrack.time > 0) {
              event.target.seekTo(currentTrack.time, true);
            }
          } else {
            event.target.pauseVideo();
          }
        },
        onStateChange: (event: any) => {
          if (event.data === YT.PlayerState.ENDED) {
            ended();
          }
        },
      },
    });

    return () => {
      try {
        player.destroy();
      } catch {}
    };
  }, [playerReady, currentTrack?.videoId]);

  // Sync play/pause state
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch {}
  }, [isPlaying]);

  // Volume
  useEffect(() => {
    if (playerRef.current) {
      try {
        playerRef.current.setVolume(isMuted ? 0 : volume);
      } catch {}
    }
  }, [volume, isMuted]);

  // Track current time for progress bar
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        try {
          setCurrentTime(playerRef.current.getCurrentTime());
        } catch {}
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }
    const timeout = setTimeout(() => search(searchQuery), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Auto-scroll chat
  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const handleCopyCode = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentTrack || (!isHost && !room?.settings?.allowGuestControl)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const time = pct * currentTrack.duration;
    seek(time);
    setCurrentTime(time);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolume(0);
    }
  };

  const handleLeave = () => {
    leaveRoom();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="flex items-end justify-center gap-0.5 mb-4 h-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="visualizer-bar" />
            ))}
          </div>
          <p className="text-text-secondary text-sm">Joining room...</p>
        </motion.div>
      </div>
    );
  }

  const onlineParticipants = room?.participants.filter((p) => p.isOnline) || [];
  const progressPct = currentTrack ? (currentTime / currentTrack.duration) * 100 : 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ═══ TOP BAR ═══ */}
      <header className="glass h-14 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={handleLeave} className="btn-icon" id="leave-room-btn">
            <HiArrowLeft />
          </button>
          <div>
            <h1 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <HiMusicalNote className="text-primary" />
              {room?.name || 'SyncParty'}
              {isHost && (
                <button
                  onClick={() => updateSettings({ allowGuestControl: !room?.settings?.allowGuestControl })}
                  className={`text-[9px] px-1.5 py-0.5 rounded-full ml-1 border ${
                    room?.settings?.allowGuestControl
                      ? 'bg-success/10 text-success border-success/30'
                      : 'bg-bg-primary text-text-muted border-border'
                  }`}
                  title="Toggle who can control playback"
                  id="toggle-guest-control-btn"
                >
                  {room?.settings?.allowGuestControl ? 'ANYONE CAN CONTROL' : 'HOST ONLY'}
                </button>
              )}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-mono">{room?.roomCode}</span>
              <button onClick={handleCopyCode} className="text-xs text-text-muted hover:text-primary transition-colors" id="copy-code-btn">
                {copied ? <HiCheck className="text-success" /> : <HiClipboard />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full glass text-xs text-text-secondary">
            <HiSignal className={`text-sm ${isConnected ? 'text-success' : 'text-danger'}`} />
            <span>{onlineParticipants.length} online</span>
          </div>
          <div className="flex -space-x-2">
            {onlineParticipants.slice(0, 5).map((p) => (
              <div
                key={p.userId}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-bg-primary"
                style={{ background: p.avatarColor }}
                title={p.username}
              >
                {getInitials(p.username)}
              </div>
            ))}
            {onlineParticipants.length > 5 && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium glass border-2 border-bg-primary">
                +{onlineParticipants.length - 5}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── QUEUE PANEL (Left) ─── */}
        <aside className={`w-80 shrink-0 flex flex-col glass-light border-r border-border hide-mobile ${activePanel !== 'queue' ? 'lg:flex' : ''}`}>
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <HiQueueList className="text-primary" />
              Queue
              {queue.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                  {queue.length}
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="btn-icon text-sm"
              id="toggle-search-btn"
            >
              {showSearch ? <HiXMark /> : <HiMagnifyingGlass />}
            </button>
          </div>

          {/* Search */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 border-b border-border">
                  <div className="relative">
                    <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search YouTube..."
                      className="input pl-9 text-sm"
                      id="search-input"
                    />
                  </div>
                </div>

                {/* Search Results */}
                {(searchResults.length > 0 || searching) && (
                  <div className="max-h-64 overflow-y-auto border-b border-border">
                    {searching ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-3">
                            <div className="skeleton w-20 h-12 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="skeleton h-3 w-3/4 rounded" />
                              <div className="skeleton h-2 w-1/2 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      searchResults.map((result) => (
                        <div
                          key={result.videoId}
                          className="flex items-center gap-3 p-2.5 px-3 hover:bg-surface-hover transition-colors cursor-pointer group"
                        >
                          <img
                            src={result.thumbnail}
                            alt={result.title}
                            className="w-16 h-10 object-cover rounded-lg shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{result.title}</p>
                            <p className="text-[10px] text-text-muted truncate">{result.channelTitle} · {formatDuration(result.duration)}</p>
                          </div>
                          <button
                            onClick={() => {
                              addTrack(result);
                              setSearchQuery('');
                              clearSearch();
                              setShowSearch(false);
                            }}
                            className="btn-icon text-sm opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary-light"
                            id={`add-track-${result.videoId}`}
                          >
                            <HiPlusCircle className="text-lg" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Queue Items */}
          <div className="flex-1 overflow-y-auto">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <HiMusicalNote className="text-3xl text-text-muted mb-3" />
                <p className="text-sm text-text-muted mb-1">Queue is empty</p>
                <p className="text-xs text-text-muted">Search for songs to add</p>
              </div>
            ) : (
              queue.map((item, index) => (
                <motion.div
                  key={`${item.videoId}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-2.5 px-3 hover:bg-surface-hover transition-colors group"
                >
                  <span className="text-[10px] text-text-muted w-4 text-center shrink-0">{index + 1}</span>
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-12 h-8 object-cover rounded-md shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.title}</p>
                    <p className="text-[10px] text-text-muted truncate">
                      {item.addedByUsername} · {formatDuration(item.duration)}
                    </p>
                  </div>
                  {(isHost || item.addedBy === user?.id) && (
                    <button
                      onClick={() => removeTrack(index)}
                      className="btn-icon text-xs opacity-0 group-hover:opacity-100 transition-opacity text-danger"
                    >
                      <HiTrash />
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </aside>

        {/* ─── CENTER: NOW PLAYING ─── */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Video Player (hidden) */}
          <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden">
            <div id="yt-player" />
          </div>

          {/* Now Playing Display */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
            {currentTrack ? (
              <motion.div
                key={currentTrack.videoId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg text-center"
              >
                {/* Album Art */}
                <div className="relative mx-auto mb-8 w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={currentTrack.thumbnail?.replace('mqdefault', 'hqdefault') || `https://img.youtube.com/vi/${currentTrack.videoId}/hqdefault.jpg`}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  
                  {/* Visualizer overlay */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className={`visualizer-bar ${!isPlaying ? 'paused' : ''}`}
                        style={{ background: 'rgba(255,255,255,0.8)' }}
                      />
                    ))}
                  </div>

                  {isHost && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary/80 text-[10px] font-bold text-white">
                      HOST
                    </div>
                  )}
                </div>

                {/* Song Info */}
                <h2 className="text-xl md:text-2xl font-bold mb-1 truncate px-4" style={{ fontFamily: 'var(--font-display)' }}>
                  {currentTrack.title}
                </h2>
                <p className="text-sm text-text-secondary mb-6">{currentTrack.channelTitle}</p>

                {/* Progress Bar */}
                <div className="w-full mb-4 px-4">
                  <div className="progress-bar" onClick={handleSeek}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min(progressPct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-text-muted font-mono">
                      {formatDuration(currentTime)}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      {formatDuration(currentTrack.duration)}
                    </span>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={voteToSkip}
                    className="btn-icon"
                    title="Vote to skip"
                    id="skip-vote-btn"
                  >
                    <HiHandThumbUp />
                  </button>
                  <button
                    onClick={() => {
                      if (isHost || room?.settings?.allowGuestControl) {
                        if (isPlaying) {
                          pause(currentTime);
                        } else {
                          play();
                        }
                      }
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${
                      (isHost || room?.settings?.allowGuestControl)
                        ? 'bg-primary hover:bg-primary-light glow-purple text-white cursor-pointer'
                        : 'glass text-text-muted cursor-not-allowed opacity-50'
                    }`}
                    disabled={!isHost && !room?.settings?.allowGuestControl}
                    id="play-pause-btn"
                  >
                    {isPlaying ? <HiPause /> : <HiPlay className="ml-0.5" />}
                  </button>
                  <button
                    onClick={() => (isHost || room?.settings?.allowGuestControl) && ended()}
                    className={`btn-icon ${(!isHost && !room?.settings?.allowGuestControl) ? 'opacity-30 cursor-not-allowed' : ''}`}
                    disabled={!isHost && !room?.settings?.allowGuestControl}
                    title="Skip to next"
                    id="skip-next-btn"
                  >
                    <HiForward />
                  </button>
                </div>

                {/* Volume */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={toggleMute} className="btn-icon text-sm" id="mute-btn">
                    {isMuted || volume === 0 ? <HiSpeakerXMark /> : <HiSpeakerWave />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setIsMuted(false);
                      setVolume(parseInt(e.target.value));
                    }}
                    className="w-24 accent-primary"
                    id="volume-slider"
                  />
                </div>
              </motion.div>
            ) : (
              /* Empty State */
              <div className="text-center">
                <div className="flex items-end justify-center gap-0.5 mb-6 h-10">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="visualizer-bar paused" />
                  ))}
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  No song playing
                </h2>
                <p className="text-sm text-text-secondary mb-4">Search and add songs to get the party started!</p>
                <button
                  onClick={() => {
                    setShowSearch(true);
                    setActivePanel('queue');
                  }}
                  className="btn-primary"
                  id="add-first-song-btn"
                >
                  <HiMagnifyingGlass /> Search for music
                </button>
              </div>
            )}
          </div>

          {/* Mobile Tab Bar */}
          <div className="show-mobile-only glass border-t border-border flex shrink-0">
            <button
              onClick={() => setActivePanel('queue')}
              className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
                activePanel === 'queue' ? 'text-primary' : 'text-text-muted'
              }`}
              id="mobile-queue-tab"
            >
              <HiQueueList className="text-lg mx-auto mb-0.5" />
              Queue
            </button>
            <button
              onClick={() => setActivePanel('chat')}
              className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
                activePanel === 'chat' ? 'text-primary' : 'text-text-muted'
              }`}
              id="mobile-chat-tab"
            >
              <HiChatBubbleLeftRight className="text-lg mx-auto mb-0.5" />
              Chat
            </button>
          </div>
        </main>

        {/* ─── CHAT PANEL (Right) ─── */}
        <aside className={`w-80 shrink-0 flex flex-col glass-light border-l border-border hide-mobile`}>
          {/* Participants */}
          <div className="p-3 border-b border-border">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HiUserGroup className="text-sm" />
              Participants ({onlineParticipants.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {onlineParticipants.map((p) => (
                <div
                  key={p.userId}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full glass text-xs"
                >
                  <div className="relative">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ background: p.avatarColor }}
                    >
                      {getInitials(p.username)}
                    </div>
                    <div className="online-dot" style={{ width: 6, height: 6, bottom: -1, right: -1 }} />
                  </div>
                  <span className="text-text-secondary">{p.username}</span>
                  {room?.hostId === p.userId && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-primary/20 text-primary font-bold">HOST</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Header */}
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <HiChatBubbleLeftRight className="text-primary" />
              Chat
            </h2>
          </div>

          {/* Messages */}
          <div id="chat-messages" className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <HiChatBubbleLeftRight className="text-2xl text-text-muted mb-2" />
                <p className="text-xs text-text-muted">No messages yet</p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={msg.type === 'system' ? 'text-center' : 'flex gap-2.5'}
                >
                  {msg.type === 'system' ? (
                    <p className="text-[10px] text-text-muted italic px-3 py-1 glass rounded-full inline-block">
                      {msg.content}
                    </p>
                  ) : (
                    <>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                        style={{ background: msg.avatarColor }}
                      >
                        {getInitials(msg.username)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-xs font-semibold">{msg.username}</span>
                          <span className="text-[10px] text-text-muted">{timeAgo(msg.createdAt)}</span>
                        </div>
                        <p className={`text-sm ${msg.type === 'emoji' ? 'text-2xl' : 'text-text-secondary'}`}>
                          {msg.content}
                        </p>
                      </div>
                    </>
                  )}
                </motion.div>
              ))
            )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <div className="flex gap-0">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
                <span className="text-[10px] text-text-muted">
                  Someone is typing...
                </span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => {
                  setChatInput(e.target.value);
                  sendTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="input text-sm flex-1"
                maxLength={1000}
                id="chat-input"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="btn-icon text-primary disabled:opacity-30"
                id="send-message-btn"
              >
                <HiPaperAirplane />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Panel Overlay */}
      <AnimatePresence>
        {typeof window !== 'undefined' && window.innerWidth < 769 && (activePanel === 'queue' || activePanel === 'chat') && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-14 z-30 glass flex flex-col show-mobile-only"
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {activePanel === 'queue' ? '🎵 Queue' : '💬 Chat'}
              </h2>
              <button onClick={() => setActivePanel(activePanel === 'queue' ? 'chat' : 'queue')} className="btn-icon">
                <HiXMark />
              </button>
            </div>
            {/* Mobile panel content would mirror desktop panels */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
