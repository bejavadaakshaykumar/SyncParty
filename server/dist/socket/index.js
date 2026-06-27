"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketUserMap = void 0;
exports.setupSocketIO = setupSocketIO;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const roomHandlers_js_1 = require("./roomHandlers.js");
const playerHandlers_js_1 = require("./playerHandlers.js");
const queueHandlers_js_1 = require("./queueHandlers.js");
const chatHandlers_js_1 = require("./chatHandlers.js");
// Track socket -> user mapping
exports.socketUserMap = new Map();
function setupSocketIO(io) {
    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET);
            socket.userId = decoded.userId;
            socket.username = decoded.username;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.userId;
        const username = socket.username;
        console.log(`🔌 User connected: ${username} (${socket.id})`);
        exports.socketUserMap.set(socket.id, { userId, username, roomCode: null });
        // Set up all event handlers
        (0, roomHandlers_js_1.setupRoomHandlers)(io, socket);
        (0, playerHandlers_js_1.setupPlayerHandlers)(io, socket);
        (0, queueHandlers_js_1.setupQueueHandlers)(io, socket);
        (0, chatHandlers_js_1.setupChatHandlers)(io, socket);
        // Handle disconnect
        socket.on('disconnect', async () => {
            const userData = exports.socketUserMap.get(socket.id);
            if (userData?.roomCode) {
                await (0, roomHandlers_js_1.handleUserLeftRoom)(io, socket, userData.roomCode, userData.userId, userData.username);
            }
            exports.socketUserMap.delete(socket.id);
            console.log(`🔌 User disconnected: ${username} (${socket.id})`);
        });
    });
}
//# sourceMappingURL=index.js.map