"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupChatHandlers = setupChatHandlers;
const Message_js_1 = require("../models/Message.js");
const Room_js_1 = require("../models/Room.js");
const index_js_1 = require("./index.js");
// Track typing state per room
const typingUsers = new Map();
function setupChatHandlers(io, socket) {
    const userId = socket.userId;
    const username = socket.username;
    // Send a message
    socket.on('chat:message', async ({ content, mentions }) => {
        try {
            const userData = index_js_1.socketUserMap.get(socket.id);
            if (!userData?.roomCode)
                return;
            if (!content || content.trim().length === 0 || content.length > 1000)
                return;
            const room = await Room_js_1.Room.findOne({ roomCode: userData.roomCode, isActive: true });
            if (!room)
                return;
            const participant = room.participants.find((p) => p.userId.toString() === userId);
            const message = new Message_js_1.Message({
                roomId: room._id,
                userId,
                username,
                avatarColor: participant?.avatarColor || '#8B5CF6',
                content: content.trim(),
                type: isEmojiOnly(content.trim()) ? 'emoji' : 'text',
                mentions: mentions || [],
            });
            await message.save();
            io.to(userData.roomCode).emit('chat:new-message', {
                id: message._id,
                userId: message.userId,
                username: message.username,
                avatarColor: message.avatarColor,
                content: message.content,
                type: message.type,
                mentions: message.mentions,
                createdAt: message.createdAt,
            });
            // Clear typing indicator
            clearTyping(userData.roomCode, userId);
            socket.to(userData.roomCode).emit('chat:typing-indicator', {
                users: getTypingUsers(userData.roomCode),
            });
        }
        catch (error) {
            console.error('Chat message error:', error);
        }
    });
    // Typing indicator
    socket.on('chat:typing', () => {
        const userData = index_js_1.socketUserMap.get(socket.id);
        if (!userData?.roomCode)
            return;
        // Set typing with auto-clear after 3 seconds
        if (!typingUsers.has(userData.roomCode)) {
            typingUsers.set(userData.roomCode, new Map());
        }
        const roomTyping = typingUsers.get(userData.roomCode);
        // Clear existing timeout
        const existing = roomTyping.get(userId);
        if (existing)
            clearTimeout(existing);
        // Set new timeout
        roomTyping.set(userId, setTimeout(() => {
            clearTyping(userData.roomCode, userId);
            socket.to(userData.roomCode).emit('chat:typing-indicator', {
                users: getTypingUsers(userData.roomCode),
            });
        }, 3000));
        socket.to(userData.roomCode).emit('chat:typing-indicator', {
            users: getTypingUsers(userData.roomCode),
        });
    });
}
function clearTyping(roomCode, clearUserId) {
    const roomTyping = typingUsers.get(roomCode);
    if (!roomTyping)
        return;
    const timeout = roomTyping.get(clearUserId);
    if (timeout)
        clearTimeout(timeout);
    roomTyping.delete(clearUserId);
}
function getTypingUsers(roomCode) {
    const roomTyping = typingUsers.get(roomCode);
    if (!roomTyping)
        return [];
    return Array.from(roomTyping.keys());
}
function isEmojiOnly(text) {
    const emojiRegex = /^[\p{Emoji}\p{Emoji_Component}\s]+$/u;
    return emojiRegex.test(text) && text.trim().length <= 12;
}
//# sourceMappingURL=chatHandlers.js.map