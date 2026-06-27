# 🎵 SyncParty

> **Listen Together, Anywhere.** — Create shared music rooms and enjoy YouTube music in perfect real-time synchronization.

![SyncParty](https://img.shields.io/badge/SyncParty-v1.0.0-8B5CF6?style=for-the-badge&logo=headphones&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-25C2A0?style=flat-square&logo=socket.io)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)

## ✨ Features

- **Real-time Music Sync** — Host-authoritative playback with heartbeat sync
- **Room System** — Unique room codes, invite links, host controls
- **YouTube Integration** — Search, play, and queue YouTube videos
- **Live Chat** — Room chat with emoji support, typing indicators
- **Shared Queue** — Add, remove, reorder tracks collaboratively
- **Vote to Skip** — Democratic track skipping
- **Premium UI** — Glassmorphism, animated gradients, music visualizer
- **Responsive** — Desktop, tablet, and mobile layouts

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- **YouTube API Key** (optional, for search - see below)

### 1. Install Dependencies

```bash
cd syncparty

# Install server dependencies
cd server && npm install

# Install client dependencies  
cd ../client && npm install --legacy-peer-deps
```

### 2. Configure Environment

```bash
# Copy example env
cp .env.example server/.env
```

Edit `server/.env`:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/syncparty   # or your Atlas URI
JWT_SECRET=your-secure-random-string
YOUTUBE_API_KEY=your-api-key                       # optional
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Development

Open two terminal windows:

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

Open **http://localhost:3000** 🎉

### 4. YouTube API Key (Optional)

The app works without a YouTube API key (you can add videos by URL), but for search:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **YouTube Data API v3**
3. Create an **API Key** under Credentials
4. Add the key to `server/.env` as `YOUTUBE_API_KEY`

## 🏗️ Architecture

```
syncparty/
├── client/          # Next.js 15 + TypeScript + Tailwind CSS
│   └── src/
│       ├── app/     # App Router pages
│       ├── hooks/   # Custom React hooks
│       ├── lib/     # API client, Socket.IO, utils
│       ├── store/   # Zustand state management
│       └── types/   # TypeScript interfaces
├── server/          # Express + Socket.IO + MongoDB
│   └── src/
│       ├── config/  # DB & env config
│       ├── models/  # Mongoose schemas
│       ├── routes/  # REST API endpoints
│       ├── socket/  # Real-time event handlers
│       ├── middleware/ # Auth, rate limiting, validation
│       └── utils/   # Sync engine, room codes
```

## 🎛️ Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `room:join` | C→S | Join a room |
| `room:state` | S→C | Full room state |
| `player:play` | C→S | Play track |
| `player:pause` | C→S | Pause playback |
| `player:sync` | S→C | Sync all clients |
| `player:heartbeat` | S→C | Periodic sync (5s) |
| `queue:add` | C→S | Add to queue |
| `queue:update` | S→C | Queue changed |
| `chat:message` | C→S | Send message |
| `chat:new-message` | S→C | Broadcast message |

## 🎨 Design

- **Colors**: Neon purple, cyan, blue accents on deep dark backgrounds
- **Effects**: Glassmorphism, animated gradients, glow effects
- **Typography**: Inter (body) + Outfit (headings)
- **Animations**: Framer Motion page/component transitions

## 📱 Responsive

- **Desktop**: 3-column layout (Queue | Player | Chat)
- **Tablet**: Collapsible side panels
- **Mobile**: Tab-based navigation, full-screen panels

## 🔒 Security

- JWT authentication
- Rate limiting on all endpoints
- Zod input validation
- CORS configured
- Host-only playback controls

---

Built with ❤️ and 🎵
