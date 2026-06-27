"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_js_1 = __importDefault(require("./app.js"));
const env_js_1 = require("./config/env.js");
const db_js_1 = require("./config/db.js");
const index_js_1 = require("./socket/index.js");
async function main() {
    // Connect to MongoDB
    await (0, db_js_1.connectDB)();
    // Create HTTP server
    const server = http_1.default.createServer(app_js_1.default);
    // Setup Socket.IO
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: env_js_1.env.CORS_ORIGIN,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        },
    });
    (0, index_js_1.setupSocketIO)(io);
    // Start server
    server.listen(env_js_1.env.PORT, () => {
        console.log(`
╔══════════════════════════════════════════╗
║          🎵 SyncParty Server 🎵         ║
╠══════════════════════════════════════════╣
║  HTTP:   http://localhost:${env_js_1.env.PORT}          ║
║  Socket: ws://localhost:${env_js_1.env.PORT}            ║
║  CORS:   ${env_js_1.env.CORS_ORIGIN.join(', ').padEnd(30)}║
╚══════════════════════════════════════════╝
    `);
    });
}
main().catch(console.error);
//# sourceMappingURL=index.js.map