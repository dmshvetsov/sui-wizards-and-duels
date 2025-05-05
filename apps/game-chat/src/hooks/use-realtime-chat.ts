'use client';

import { ChatMessage } from '@/lib/message';
import { createMessage, createRoom, getMessages, removeRoom } from '@/lib/supabase/client';
import { useCallback, useEffect, useState } from 'react';

interface UseRealtimeChatProps {
  roomName: string;
  username: string;
}

const EVENT_MESSAGE_TYPE = 'message';

export function useRealtimeChat({ roomName, username }: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channel, setChannel] = useState<ReturnType<typeof createRoom> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newChannel = createRoom(roomName);

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        setMessages((current) => [...current, payload.payload as ChatMessage]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    setChannel(newChannel);

    getMessages(roomName).then((res) => {
      if (res.error) {
        console.error(res.error);
        return;
      }

      setMessages(res.data);
    });

    return () => {
      removeRoom(newChannel);
    };
  }, [roomName, username]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!channel || !isConnected) return;

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        text,
        username,
        channel: roomName,
        timestamp: new Date().toISOString(),
      };

      // Update local state immediately for the sender
      setMessages((current) => [...current, message]);

      await createMessage(message);
      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      });
    },
    [channel, isConnected, username]
  );

  return { messages, sendMessage, isConnected };
}
