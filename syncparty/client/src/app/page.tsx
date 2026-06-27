'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRoom } from '@/hooks/useRoom';
import { HiMusicalNote, HiUsers, HiChatBubbleLeftRight, HiQueueList, HiPlay, HiSparkles, HiLink } from 'react-icons/hi2';

export default function LandingPage() {
  const router = useRouter();
  const { user, guestLogin, checkAuth, loading: authLoading } = useAuth();
  const { createRoom, joinRoom } = useRoom();
  const [showAuth, setShowAuth] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [action, setAction] = useState<'create' | 'join' | null>(null);
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth().finally(() => setCheckingAuth(false));
  }, []);

  const handleCreateRoom = async () => {
    if (!user) {
      setAction('create');
      setShowAuth(true);
      return;
    }
    setShowAuth(false);
    setShowJoin(false);
    setLoading(true);
    setError('');
    try {
      const name = roomName.trim() || `${user.username}'s Room`;
      const code = await createRoom(name);
      if (code) {
        router.push(`/room/${code}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user) {
      setAction('join');
      setShowAuth(true);
      return;
    }
    if (!roomCode.trim() || roomCode.trim().length < 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const success = await joinRoom(roomCode.trim());
      if (success) {
        router.push(`/room/${roomCode.trim().toUpperCase()}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    setLoading(true);
    setError('');
    const result = await guestLogin(username.trim());
    if (result) {
      setShowAuth(false);
      if (action === 'create') {
        const name = roomName.trim() || `${result.username}'s Room`;
        const code = await createRoom(name);
        if (code) router.push(`/room/${code}`);
      } else if (action === 'join') {
        setShowJoin(true);
      }
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="visualizer-bar" />
          <div className="visualizer-bar" />
          <div className="visualizer-bar" />
          <div className="visualizer-bar" />
          <div className="visualizer-bar" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Floating Music Notes */}
      <FloatingNotes />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-4xl mx-auto"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
        >
          <HiSparkles className="text-primary text-sm" />
          <span className="text-sm text-text-secondary font-medium">Real-time music sync for everyone</span>
        </motion.div>

        {/* Main Heading */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span className="gradient-text">Listen Together</span>
          <br />
          <span className="text-text-primary">Anywhere.</span>
        </h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Create a room, invite your friends, and enjoy YouTube music together
          in perfect sync. Chat, build playlists, and vibe together — no matter where you are.
        </motion.p>

        {/* Visualizer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-end justify-center gap-0.5 mb-10 h-8"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="visualizer-bar" />
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="btn-primary text-base px-8 py-3.5 rounded-2xl glow-purple min-w-[200px]"
          >
            <HiPlay className="text-lg" />
            Create Room
          </button>
          <button
            onClick={() => {
              if (!user) {
                setAction('join');
                setShowAuth(true);
              } else {
                setShowJoin(true);
              }
            }}
            disabled={loading}
            className="btn-secondary text-base px-8 py-3.5 rounded-2xl min-w-[200px]"
          >
            <HiLink className="text-lg" />
            Join Room
          </button>
        </motion.div>

        {/* User badge if logged in */}
        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: user.avatarColor }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <span className="text-text-secondary">Playing as <span className="text-text-primary font-medium">{user.username}</span></span>
          </motion.div>
        )}
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16 w-full"
      >
        {[
          { icon: HiMusicalNote, title: 'Perfect Sync', desc: 'Millisecond-precise playback sync' },
          { icon: HiUsers, title: 'Party Mode', desc: 'Invite unlimited friends' },
          { icon: HiChatBubbleLeftRight, title: 'Live Chat', desc: 'Chat with emoji while listening' },
          { icon: HiQueueList, title: 'Shared Queue', desc: 'Collaborative playlist building' },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.1 }}
            className="glass rounded-2xl p-5 text-center glass-hover transition-all duration-300"
          >
            <feature.icon className="text-2xl text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
            <p className="text-xs text-text-muted">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <Modal onClose={() => { setShowAuth(false); setError(''); }}>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Welcome to <span className="gradient-text">SyncParty</span>
            </h2>
            <p className="text-sm text-text-secondary mb-6">Choose a name to get started</p>
            {error && <p className="text-danger text-sm mb-4 glass rounded-lg p-3">{error}</p>}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGuestLogin()}
              placeholder="Enter your name..."
              className="input mb-4"
              maxLength={30}
              autoFocus
              id="guest-username-input"
            />
            {action === 'create' && (
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name (optional)"
                className="input mb-4"
                maxLength={50}
                id="room-name-input"
              />
            )}
            <button
              onClick={handleGuestLogin}
              disabled={loading || authLoading}
              className="btn-primary w-full py-3 rounded-xl"
              id="guest-login-btn"
            >
              {loading ? 'Getting ready...' : 'Continue as Guest'}
            </button>
          </Modal>
        )}
      </AnimatePresence>

      {/* Join Room Modal */}
      <AnimatePresence>
        {showJoin && (
          <Modal onClose={() => { setShowJoin(false); setError(''); setRoomCode(''); }}>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Join a <span className="gradient-text">Room</span>
            </h2>
            <p className="text-sm text-text-secondary mb-6">Enter the 6-character room code</p>
            {error && <p className="text-danger text-sm mb-4 glass rounded-lg p-3">{error}</p>}
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              placeholder="ABCDEF"
              className="input mb-4 text-center text-2xl tracking-[0.5em] font-mono uppercase"
              maxLength={6}
              autoFocus
              id="room-code-input"
            />
            <button
              onClick={handleJoinRoom}
              disabled={loading || roomCode.length < 6}
              className="btn-primary w-full py-3 rounded-xl"
              id="join-room-btn"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </Modal>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ─── Floating Music Notes ───────────────────────── */
function FloatingNotes() {
  const [notes, setNotes] = useState<Array<{ id: number; x: number; delay: number; symbol: string }>>([]);

  useEffect(() => {
    const symbols = ['♪', '♫', '♬', '♩', '🎵', '🎶'];
    const generated = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 8,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
    }));
    setNotes(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {notes.map((note) => (
        <div
          key={note.id}
          className="absolute text-xl opacity-0"
          style={{
            left: `${note.x}%`,
            bottom: '-20px',
            animation: `float-note 6s ease-in-out ${note.delay}s infinite`,
            color: 'rgba(139, 92, 246, 0.2)',
          }}
        >
          {note.symbol}
        </div>
      ))}
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="glass rounded-3xl p-8 max-w-md w-full relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn-icon text-text-muted"
          id="modal-close-btn"
        >
          ✕
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}
