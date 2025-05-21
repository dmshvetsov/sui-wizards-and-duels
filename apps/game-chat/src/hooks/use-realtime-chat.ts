'use client'

import { ChatMessage } from '@/lib/message'
import { createMessage, createRoom, getMessages, removeRoom } from '@/lib/supabase/client'
import { useCallback, useEffect, useState } from 'react'

interface UseRealtimeChatProps {
  roomName: string
  username: string
  onIncomingMessage?: (message: string) => void
}

const EVENT_MESSAGE_TYPE = 'message'

export function useRealtimeChat({ roomName, username, onIncomingMessage }: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof createRoom> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const newChannel = createRoom(roomName)

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        const chatMessage = payload.payload as ChatMessage
        onIncomingMessage?.(chatMessage.text)
        setMessages((current) => [...current, chatMessage])
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        }
      })

    setChannel(newChannel)

    getMessages(roomName).then((res) => {
      if (res.error) {
        console.error(res.error)
        return
      }

      setMessages(res.data)
    })

    return () => {
      removeRoom(newChannel)
    }
  }, [roomName, username, onIncomingMessage])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!channel || !isConnected) return

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        text,
        username,
        channel: roomName,
        timestamp: new Date().toISOString(),
      }

      // Update local state immediately for the sender
      setMessages((current) => [...current, message])

      await createMessage(message)
      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })
    },
    [channel, isConnected, roomName, username]
  )

  return { messages, sendMessage, isConnected }
}
