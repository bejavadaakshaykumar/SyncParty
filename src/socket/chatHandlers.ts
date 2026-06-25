import type { Server, Socket } from 'socket.io';
import { Message } from '../models/Message.js';
import { Room } from '../models/Room.js';
import { socketUserMap } from './index.js';

// Track typing state per room
const typingUsers = new Map<string, Map<string, NodeJS.Timeout>>();

export function setupChatHandlers(io: Server, socket: Socket): void {
  const userId = (socket as any).userId as string;
  const username = (socket as any).username as string;

  // Send a message
  socket.on('chat:message', async ({ content, mentions }: { content: string; mentions?: string[] }) => {
    try {
      const userData = socketUserMap.get(socket.id);
      if (!userData?.roomCode) return;

      if (!content || content.trim().length === 0 || content.length > 1000) return;

      const room = await Room.findOne({ roomCode: userData.roomCode, isActive: true });
      if (!room) return;

      const participant = room.participants.find((p) => p.userId.toString() === userId);

      const message = new Message({
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
    } catch (error) {
      console.error('Chat message error:', error);
    }
  });

  // Typing indicator
  socket.on('chat:typing', () => {
    const userData = socketUserMap.get(socket.id);
    if (!userData?.roomCode) return;

    // Set typing with auto-clear after 3 seconds
    if (!typingUsers.has(userData.roomCode)) {
      typingUsers.set(userData.roomCode, new Map());
    }

    const roomTyping = typingUsers.get(userData.roomCode)!;

    // Clear existing timeout
    const existing = roomTyping.get(userId);
    if (existing) clearTimeout(existing);

    // Set new timeout
    roomTyping.set(
      userId,
      setTimeout(() => {
        clearTyping(userData.roomCode!, userId);
        socket.to(userData.roomCode!).emit('chat:typing-indicator', {
          users: getTypingUsers(userData.roomCode!),
        });
      }, 3000)
    );

    socket.to(userData.roomCode).emit('chat:typing-indicator', {
      users: getTypingUsers(userData.roomCode),
    });
  });
}

function clearTyping(roomCode: string, clearUserId: string): void {
  const roomTyping = typingUsers.get(roomCode);
  if (!roomTyping) return;

  const timeout = roomTyping.get(clearUserId);
  if (timeout) clearTimeout(timeout);
  roomTyping.delete(clearUserId);
}

function getTypingUsers(roomCode: string): string[] {
  const roomTyping = typingUsers.get(roomCode);
  if (!roomTyping) return [];
  return Array.from(roomTyping.keys());
}

function isEmojiOnly(text: string): boolean {
  const emojiRegex = /^[\p{Emoji}\p{Emoji_Component}\s]+$/u;
  return emojiRegex.test(text) && text.trim().length <= 12;
}
