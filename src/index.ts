import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { setupSocketIO } from './socket/index.js';

async function main() {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server
  const server = http.createServer(app);

  // Setup Socket.IO
  const io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    },
  });

  setupSocketIO(io);

  // Start server
  server.listen(env.PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║          🎵 SyncParty Server 🎵         ║
╠══════════════════════════════════════════╣
║  HTTP:   http://localhost:${env.PORT}          ║
║  Socket: ws://localhost:${env.PORT}            ║
║  CORS:   ${env.CORS_ORIGIN.join(', ').padEnd(30)}║
╚══════════════════════════════════════════╝
    `);
  });
}

main().catch(console.error);
