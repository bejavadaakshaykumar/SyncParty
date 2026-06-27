'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAppStore } from '@/store';
import type { ChatMessage } from '@/types';

export function useChat() {
  const { messages, addMessage, setMessages, typingUsers, setTypingUsers } = useAppStore();
  const { emit, on } = useSocket();

  // Listen for chat events
  useEffect(() => {
    const cleanups = [
      on('chat:new-message', (msg: ChatMessage) => {
        addMessage(msg);
      }),
      on('chat:typing-indicator', (data: { users: string[] }) => {
        const currentUserId = useAppStore.getState().user?.id;
        setTypingUsers(data.users.filter((id) => id !== currentUserId));
      }),
    ];

    return () => cleanups.forEach((c) => c());
  }, [on, addMessage, setTypingUsers]);

  const sendMessage = useCallback(
    (content: string, mentions: string[] = []) => {
      if (!content.trim()) return;
      emit('chat:message', { content, mentions });
    },
    [emit]
  );

  const sendTyping = useCallback(() => {
    emit('chat:typing');
  }, [emit]);

  return { messages, typingUsers, sendMessage, sendTyping };
}
