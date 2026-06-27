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
  HiArrowRightOnRectangle, HiCheck, HiSignal, HiVideoCamera,
  HiRectangleStack, HiPlus
} from 'react-icons/hi2';
import { usePlaylists } from '@/hooks/usePlaylists';

type PageProps = {
  params: Promise<{ roomId: string }>;
};

export default function RoomPage({ params }: PageProps) {
  const { roomId } = use(params);
  const router = useRouter();
  const { user, checkAuth, guestLogin } = useAuth();
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
  const [showVideo, setShowVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(80);
  const [playerReady, setPlayerReady] = useState(false);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);

  const { playlists, fetchPlaylists, createPlaylist, addTrack: addTrackToPlaylist, deletePlaylist } = usePlaylists();
  const [activePlaylist, setActivePlaylist] = useState<any>(null);
  const [showPlaylistsModal, setShowPlaylistsModal] = useState(false);
  const [selectedTrackToAdd, setSelectedTrackToAdd] = useState<any>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [username, setUsername] = useState('');
  const [authError, setAuthError] = useState('');

  // Auth check
  useEffect(() => {
    const init = async () => {
      const authed = await checkAuth();
      if (!authed) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      await joinRoom(roomId);
      setLoading(false);
    };
    init();
  }, [roomId]);

  const handleGuestLogin = async () => {
    if (!username.trim()) {
      setAuthError('Please enter a username');
      return;
    }
    setLoading(true);
    setAuthError('');
    const result = await guestLogin(username.trim());
    if (result) {
      setShowAuthModal(false);
      await joinRoom(roomId);
    } else {
      setAuthError('Failed to join');
    }
    setLoading(false);
  };

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
    if (!isPlaying || isDraggingScrubber) return;

    const interval = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        try {
          setCurrentTime(playerRef.current.getCurrentTime());
        } catch {}
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isDraggingScrubber]);

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

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value));
  };

  const handleScrubberRelease = () => {
    setIsDraggingScrubber(false);
    if (!currentTrack || (!isHost && !room?.settings?.allowGuestControl)) return;
    seek(currentTime);
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
    <div className="h-screen flex flex-col overflow-hidden bg-black text-white font-sans">
      {/* Hidden YouTube Player (or Theater Mode) */}
      <div className={showVideo && currentTrack && !showSearch
          ? "absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-8 backdrop-blur-md pb-32"
          : "absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden"}>
        
        {showVideo && (
          <button 
            className="absolute top-6 right-6 text-white text-3xl hover:text-[#1ed760] z-50 transition-colors bg-black/50 p-2 rounded-full"
            onClick={() => setShowVideo(false)}
          >
            <HiXMark />
          </button>
        )}
        
        <div className={showVideo ? "w-full max-w-6xl aspect-video rounded-xl overflow-hidden shadow-2xl bg-black" : ""}>
          <div id="yt-player" className={showVideo ? "w-full h-full pointer-events-none" : ""} />
        </div>
      </div>

      {/* Main App Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ─── LEFT SIDEBAR (Navigation & Queue) ─── */}
        <aside className={`${activePanel === 'queue' ? 'flex' : 'hidden'} md:flex w-full md:w-64 flex-col bg-black shrink-0`}>
          <div className="p-6">
            <h1 className="text-xl font-bold flex items-center gap-2 mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              <HiMusicalNote className="text-[#1ed760]" />
              {room?.name || 'SyncParty'}
            </h1>
            <nav className="space-y-4 font-semibold text-sm text-gray-400">
              <button 
                className={`flex items-center gap-4 transition-colors w-full ${!showSearch && !activePlaylist ? 'text-white' : 'hover:text-white'}`}
                onClick={() => { setShowSearch(false); setActivePlaylist(null); }}
              >
                <HiPlay className="text-2xl" />
                Now Playing
              </button>
              <button 
                className={`flex items-center gap-4 transition-colors w-full ${showSearch && !activePlaylist ? 'text-white' : 'hover:text-white'}`}
                onClick={() => { setShowSearch(true); setActivePlaylist(null); setActivePanel('queue'); }}
              >
                <HiMagnifyingGlass className="text-2xl" />
                Search
              </button>
            </nav>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <button 
                  className={`flex items-center gap-4 transition-colors font-semibold text-sm ${activePlaylist ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => { setShowSearch(false); setActivePlaylist(null); }}
                >
                  <HiRectangleStack className="text-2xl" />
                  Your Library
                </button>
                <button 
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => {
                    const name = prompt('Enter playlist name:');
                    if (name) createPlaylist(name);
                  }}
                  title="Create Playlist"
                >
                  <HiPlus className="text-xl" />
                </button>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {playlists.map(p => (
                  <button
                    key={p._id}
                    className={`w-full text-left truncate text-sm px-2 py-1.5 rounded transition-colors ${activePlaylist?._id === p._id ? 'bg-[#282828] text-white font-semibold' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => {
                      setActivePlaylist(p);
                      setShowSearch(false);
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 mt-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Up Next</span>
              {queue.length > 0 && <span className="text-xs bg-[#282828] px-2 py-0.5 rounded-full">{queue.length}</span>}
            </div>
            
            {queue.length === 0 ? (
              <p className="text-xs text-gray-500 text-center mt-10">Queue is empty</p>
            ) : (
              <div className="space-y-2">
                {queue.map((item, index) => (
                  <div key={`${item.videoId}-${index}`} className="flex items-center gap-3 group p-2 hover:bg-[#282828] rounded-md transition-colors cursor-pointer">
                    <img src={item.thumbnail} alt={item.title} className="w-10 h-10 object-cover rounded shadow-md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.channelTitle}</p>
                    </div>
                    {(isHost || item.addedBy === user?.id) && (
                      <button onClick={() => removeTrack(index)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity">
                        <HiTrash />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className={`${activePanel === 'player' ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-gradient-to-b from-[#1e1e1e] to-[#121212] overflow-hidden md:rounded-lg md:mx-2 md:my-2`}>
          {/* Top Bar inside main */}
          <header className="h-16 flex items-center justify-between px-6 shrink-0 bg-transparent">
            <div className="flex items-center gap-4">
              <button onClick={handleLeave} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors">
                <HiArrowLeft className="text-white" />
              </button>
              {/* Search Bar Input */}
              {showSearch && (
                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search YouTube..."
                    className="pl-10 pr-4 py-2 bg-[#242424] rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 w-80"
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleCopyCode} className="text-xs font-mono bg-black/40 px-3 py-1.5 rounded-full hover:bg-black/60 transition-colors flex items-center gap-2">
                {room?.roomCode}
                {copied ? <HiCheck className="text-[#1ed760]" /> : <HiClipboard />}
              </button>
              {isHost && (
                <button
                  onClick={() => updateSettings({ allowGuestControl: !room?.settings?.allowGuestControl })}
                  className={`text-[10px] px-2 py-1 rounded-full border ${room?.settings?.allowGuestControl ? 'bg-[#1ed760]/20 text-[#1ed760] border-[#1ed760]/30' : 'bg-transparent text-gray-400 border-gray-600'}`}
                >
                  {room?.settings?.allowGuestControl ? 'GUEST CONTROL ON' : 'HOST ONLY'}
                </button>
              )}
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activePlaylist ? (
              // Playlist View
              <div className="space-y-6">
                <div className="flex items-end gap-6 mb-8 mt-4">
                  <div className="w-48 h-48 bg-[#282828] shadow-2xl flex items-center justify-center rounded-lg">
                    {activePlaylist.tracks?.[0] ? (
                      <img src={activePlaylist.tracks[0].thumbnail.replace('mqdefault', 'hqdefault')} className="w-full h-full object-cover rounded-lg" alt="Cover" />
                    ) : (
                      <HiMusicalNote className="text-6xl text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm uppercase font-bold text-gray-400">Playlist</p>
                    <h1 className="text-5xl font-extrabold mb-4">{activePlaylist.name}</h1>
                    <p className="text-sm text-gray-400">{activePlaylist.tracks?.length || 0} songs</p>
                    <div className="mt-4 flex items-center gap-4">
                      <button 
                        className="bg-[#1ed760] text-black w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                        onClick={() => {
                          activePlaylist.tracks.forEach((t: any) => addTrack(t));
                        }}
                        title="Play All (Add to Queue)"
                      >
                        <HiPlay className="text-2xl ml-1" />
                      </button>
                      <button
                        className="text-gray-400 hover:text-white"
                        onClick={async () => {
                          if (confirm('Delete playlist?')) {
                            await deletePlaylist(activePlaylist._id);
                            setActivePlaylist(null);
                          }
                        }}
                      >
                        <HiTrash className="text-xl" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {activePlaylist.tracks?.map((track: any, idx: number) => (
                    <div key={`${track.videoId}-${idx}`} className="flex items-center gap-4 p-3 hover:bg-[#2a2a2a] rounded-lg group transition-colors">
                      <span className="text-gray-500 w-4 text-right">{idx + 1}</span>
                      <img src={track.thumbnail} alt={track.title} className="w-10 h-10 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{track.title}</p>
                        <p className="text-sm text-gray-400 truncate">{track.channelTitle}</p>
                      </div>
                      <span className="text-sm text-gray-400 w-12">{formatDuration(track.duration)}</span>
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => addTrack(track)} className="text-gray-400 hover:text-white" title="Add to Queue">
                          <HiPlusCircle className="text-xl" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : showSearch && (searchResults.length > 0 || searching) ? (
              // Search Results
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Search Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {searchResults.map((result) => (
                    <div key={result.videoId} className="bg-[#181818] p-4 rounded-xl hover:bg-[#282828] transition-colors group relative">
                      <div className="relative aspect-video mb-4 cursor-pointer" onClick={() => { addTrack(result); setSearchQuery(''); setShowSearch(false); }}>
                        <img src={result.thumbnail.replace('mqdefault', 'hqdefault')} alt={result.title} className="w-full h-full object-cover rounded-md shadow-lg" />
                        <button className="absolute bottom-2 right-2 w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-xl">
                          <HiPlay className="text-black text-xl ml-1" />
                        </button>
                      </div>
                      <h3 className="font-semibold text-sm truncate pr-8">{result.title}</h3>
                      <p className="text-xs text-gray-400 mt-1 truncate">{result.channelTitle}</p>
                      <button 
                        className="absolute bottom-4 right-4 text-gray-400 hover:text-white"
                        title="Add to Playlist"
                        onClick={(e) => { e.stopPropagation(); setSelectedTrackToAdd(result); setShowPlaylistsModal(true); }}
                      >
                        <HiPlus className="text-xl" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Now Playing Hero (if not searching)
              currentTrack ? (
                <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center mt-10">
                  <div className="w-64 h-64 md:w-80 md:h-80 shadow-2xl mb-8 group relative rounded-md overflow-hidden">
                    <img
                      src={currentTrack.thumbnail?.replace('mqdefault', 'hqdefault') || `https://img.youtube.com/vi/${currentTrack.videoId}/hqdefault.jpg`}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">{currentTrack.title}</h1>
                  <p className="text-lg text-gray-400">{currentTrack.channelTitle}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <HiMusicalNote className="text-6xl text-gray-600 mb-6" />
                  <h1 className="text-3xl font-bold mb-4">No song playing</h1>
                  <p className="text-gray-400 mb-8 max-w-sm">Search and add songs to the queue to get the jam started!</p>
                  <button onClick={() => setShowSearch(true)} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
                    Search for Music
                  </button>
                </div>
              )
            )}
          </div>
        </main>

        {/* ─── RIGHT SIDEBAR (Chat) ─── */}
        <aside className={`${activePanel === 'chat' ? 'flex' : 'hidden'} md:flex w-full md:w-80 flex-col bg-black shrink-0`}>
           <div className="p-4 border-b border-[#282828]">
             <h3 className="font-bold mb-3 flex items-center gap-2">
               Participants <span className="text-xs bg-[#282828] px-2 py-0.5 rounded-full">{onlineParticipants.length}</span>
             </h3>
             <div className="flex flex-wrap gap-2">
               {onlineParticipants.map((p) => (
                 <div key={p.userId} className="flex items-center gap-2">
                   <div className="relative">
                     <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md" style={{ background: p.avatarColor }}>
                       {getInitials(p.username)}
                     </div>
                     <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#1ed760] rounded-full border-2 border-black" />
                   </div>
                 </div>
               ))}
             </div>
           </div>

           <div className="p-4 border-b border-[#282828] flex items-center justify-between">
             <h2 className="font-bold flex items-center gap-2">Chat</h2>
           </div>

           <div id="chat-messages" className="flex-1 overflow-y-auto p-4 space-y-4">
             {messages.length === 0 ? (
               <p className="text-sm text-gray-500 text-center mt-10">Start chatting!</p>
             ) : (
               messages.map((msg) => (
                 <div key={msg.id} className={msg.type === 'system' ? 'text-center' : 'flex gap-3'}>
                   {msg.type === 'system' ? (
                     <p className="text-xs text-gray-500 italic bg-[#181818] px-3 py-1 rounded-full inline-block">{msg.content}</p>
                   ) : (
                     <>
                       <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1" style={{ background: msg.avatarColor }}>
                         {getInitials(msg.username)}
                       </div>
                       <div className="min-w-0">
                         <div className="flex items-baseline gap-2 mb-1">
                           <span className="text-sm font-semibold hover:underline cursor-pointer">{msg.username}</span>
                           <span className="text-[10px] text-gray-500">{timeAgo(msg.createdAt)}</span>
                         </div>
                         <p className={`text-sm text-gray-300 ${msg.type === 'emoji' ? 'text-2xl' : ''}`}>{msg.content}</p>
                       </div>
                     </>
                   )}
                 </div>
               ))
             )}
             {typingUsers.length > 0 && (
               <div className="text-xs text-gray-500 italic">Someone is typing...</div>
             )}
           </div>

           <div className="p-4">
             <div className="relative">
               <input
                 type="text"
                 value={chatInput}
                 onChange={(e) => { setChatInput(e.target.value); sendTyping(); }}
                 onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                 placeholder="Message room..."
                 className="w-full bg-[#242424] text-white rounded-full pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
               />
               <button onClick={handleSendMessage} disabled={!chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-50 transition-colors">
                 <HiPaperAirplane className="transform -rotate-45 ml-0.5" />
               </button>
             </div>
           </div>
        </aside>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden bg-[#181818] border-t border-[#282828] flex shrink-0">
        <button
          onClick={() => setActivePanel('queue')}
          className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
            activePanel === 'queue' ? 'text-[#1ed760]' : 'text-gray-400'
          }`}
          id="mobile-queue-tab"
        >
          <HiQueueList className="text-lg mx-auto mb-0.5" />
          Queue
        </button>
        <button
          onClick={() => setActivePanel('player')}
          className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
            activePanel === 'player' ? 'text-[#1ed760]' : 'text-gray-400'
          }`}
          id="mobile-player-tab"
        >
          <HiPlay className="text-lg mx-auto mb-0.5" />
          Player
        </button>
        <button
          onClick={() => setActivePanel('chat')}
          className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
            activePanel === 'chat' ? 'text-[#1ed760]' : 'text-gray-400'
          }`}
          id="mobile-chat-tab"
        >
          <HiChatBubbleLeftRight className="text-lg mx-auto mb-0.5" />
          Chat
        </button>
      </div>

      {/* ─── BOTTOM PLAYBACK BAR ─── */}
      <footer className="h-[90px] bg-[#181818] border-t border-[#282828] flex items-center justify-between px-4 shrink-0 z-50 relative">
        {/* Left: Track Info */}
        <div className="w-[30%] min-w-[180px] flex items-center gap-4">
          {currentTrack ? (
            <>
              <img src={currentTrack.thumbnail} alt="Album Art" className="w-14 h-14 rounded-md object-cover shadow-md" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate hover:underline cursor-pointer">{currentTrack.title}</p>
                <p className="text-xs text-gray-400 truncate hover:underline cursor-pointer">{currentTrack.channelTitle}</p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4 opacity-50">
               <div className="w-14 h-14 bg-[#282828] rounded-md flex items-center justify-center"><HiMusicalNote className="text-xl" /></div>
               <div>
                 <p className="text-sm font-medium">No track playing</p>
               </div>
            </div>
          )}
        </div>

        {/* Center: Controls & Progress */}
        <div className="flex-1 max-w-2xl flex flex-col items-center justify-center px-4">
          <div className="flex items-center gap-6 mb-2">
            <button
              onClick={() => {
                if ((isHost || room?.settings?.allowGuestControl) && currentTrack) {
                  seek(Math.max(0, currentTime - 10));
                }
              }}
              className="text-gray-400 hover:text-white transition-colors"
              title="Rewind 10s"
            >
              <HiBackward className="text-xl" />
            </button>
            <button
              onClick={() => {
                if (isHost || room?.settings?.allowGuestControl) {
                  isPlaying ? pause(currentTime) : play();
                }
              }}
              disabled={!currentTrack || (!isHost && !room?.settings?.allowGuestControl)}
              className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {isPlaying ? <HiPause className="text-lg" /> : <HiPlay className="text-lg ml-0.5" />}
            </button>
            <button
              onClick={() => {
                if ((isHost || room?.settings?.allowGuestControl) && currentTrack) {
                  seek(Math.min(currentTrack.duration, currentTime + 10));
                }
              }}
              className="text-gray-400 hover:text-white transition-colors"
              title="Fast Forward 10s"
            >
              <HiForward className="text-xl" />
            </button>
            <button
              onClick={() => (isHost || room?.settings?.allowGuestControl) && ended()}
              disabled={!currentTrack || (!isHost && !room?.settings?.allowGuestControl)}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 ml-4"
              title="Skip to Next Track"
            >
              <HiArrowRightOnRectangle className="text-xl" />
            </button>
          </div>
          <div className="w-full flex items-center gap-2 text-xs text-gray-400 font-mono">
            <span className="w-10 text-right">{formatDuration(currentTime)}</span>
            <div className="flex-1 h-1 bg-[#4d4d4d] rounded-full overflow-hidden flex items-center group relative cursor-pointer">
              <input
                type="range"
                min="0"
                max={currentTrack?.duration || 100}
                value={currentTime}
                step="0.1"
                onMouseDown={() => setIsDraggingScrubber(true)}
                onTouchStart={() => setIsDraggingScrubber(true)}
                onChange={handleScrubberChange}
                onMouseUp={handleScrubberRelease}
                onTouchEnd={handleScrubberRelease}
                disabled={!currentTrack || (!isHost && !room?.settings?.allowGuestControl)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              />
              <div className="h-full bg-white group-hover:bg-[#1ed760] transition-colors pointer-events-none" style={{ width: `${Math.min(progressPct, 100)}%` }} />
            </div>
            <span className="w-10">{formatDuration(currentTrack?.duration || 0)}</span>
          </div>
        </div>

        {/* Right: Volume & Extra Controls */}
        <div className="w-[30%] min-w-[180px] flex items-center justify-end gap-3">
          <button 
            className={`text-gray-400 hover:text-white transition-colors ${showVideo ? 'text-[#1ed760]' : ''}`} 
            onClick={() => { setShowVideo(!showVideo); setShowSearch(false); }}
            title="Toggle Video Mode"
          >
            <HiVideoCamera className="text-lg" />
          </button>
          <button className={`text-gray-400 hover:text-white transition-colors ${activePanel === 'queue' ? 'text-[#1ed760]' : ''}`} onClick={() => setActivePanel('queue')}>
            <HiQueueList className="text-lg" />
          </button>
          <div className="flex items-center gap-2 w-32 ml-2">
            <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <HiSpeakerXMark className="text-lg" /> : <HiSpeakerWave className="text-lg" />}
            </button>
            <div className="flex-1 h-1 bg-[#4d4d4d] rounded-full overflow-hidden flex items-center group relative cursor-pointer">
               <input
                 type="range"
                 min="0"
                 max="100"
                 value={isMuted ? 0 : volume}
                 onChange={(e) => { setIsMuted(false); setVolume(parseInt(e.target.value)); }}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               <div className="h-full bg-white group-hover:bg-[#1ed760] transition-colors pointer-events-none" style={{ width: `${isMuted ? 0 : volume}%` }} />
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {showAuthModal && (
          <Modal onClose={() => { router.push('/'); }}>
            <h2 className="text-xl font-bold mb-2">Welcome to <span className="text-[#1ed760]">SyncParty Jam</span></h2>
            <p className="text-sm text-gray-400 mb-6">Choose a name to join the session</p>
            {authError && <p className="text-red-500 text-sm mb-4 bg-red-500/10 rounded-lg p-3">{authError}</p>}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGuestLogin()}
              placeholder="Enter your name..."
              className="w-full bg-[#242424] text-white border border-[#333] rounded-md px-4 py-3 mb-4 focus:outline-none focus:border-[#1ed760]"
              maxLength={30}
              autoFocus
            />
            <button
              onClick={handleGuestLogin}
              disabled={loading || !username.trim()}
              className="w-full bg-[#1ed760] text-black font-bold py-3 rounded-full hover:bg-green-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Joining...' : 'Join Jam'}
            </button>
          </Modal>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPlaylistsModal && selectedTrackToAdd && (
          <Modal onClose={() => { setShowPlaylistsModal(false); setSelectedTrackToAdd(null); }}>
            <h2 className="text-xl font-bold mb-6">Add to Playlist</h2>
            {playlists.length === 0 ? (
              <div className="text-center text-gray-400 py-6">
                <HiRectangleStack className="text-4xl mx-auto mb-4" />
                <p>You don't have any playlists yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {playlists.map((p) => (
                  <button
                    key={p._id}
                    className="w-full flex items-center justify-between p-3 bg-[#242424] hover:bg-[#2a2a2a] rounded-lg transition-colors"
                    onClick={async () => {
                      await addTrackToPlaylist(p._id, selectedTrackToAdd);
                      setShowPlaylistsModal(false);
                      setSelectedTrackToAdd(null);
                    }}
                  >
                    <span className="font-semibold text-white truncate">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.tracks?.length || 0} songs</span>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                const name = prompt('Enter new playlist name:');
                if (name) createPlaylist(name);
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 border border-gray-600 text-white font-bold py-3 rounded-full hover:border-white transition-colors"
            >
              <HiPlus className="text-xl" /> Create New Playlist
            </button>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Modal Component ────────────────────────────── */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[#181818] border border-[#282828] rounded-xl p-8 max-w-md w-full relative z-10 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <HiXMark className="text-xl" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}
