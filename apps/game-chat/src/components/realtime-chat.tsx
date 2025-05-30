import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/chat-message'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { useRealtimeChat } from '@/hooks/use-realtime-chat'
import { isSpell, type ChatMessage } from '@/lib/message'
import { useEffect, useMemo, useState } from 'react'

interface RealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: string) => void
  onIncomingMessage?: (message: string) => void
  messages?: ChatMessage[]
  disablePersistentStorage?: boolean
}

/**
 * Real-time chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages.
 * @param onIncomingMessage - The callback function to handle the incomming messages.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat = ({
  roomName,
  username,
  onMessage,
  onIncomingMessage,
  messages: initialMessages = [],
  disablePersistentStorage,
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
  } = useRealtimeChat({
    roomName,
    username,
    onIncomingMessage,
    disablePersistentStorage,
  })
  const [newMessage, setNewMessage] = useState('')

  // Merge real-time messages with initial messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages]
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id)
    )
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    return sortedMessages
  }, [initialMessages, realtimeMessages])

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom()
  }, [allMessages, scrollToBottom])

  useEffect(() => {
    const handleKeyPress = (e: globalThis.KeyboardEvent) => {
      if (!isConnected) return

      if (e.key === 'Enter') {
        e.preventDefault()
        if (!newMessage.trim()) return

        sendMessage(newMessage)
        if (onMessage) {
          onMessage(newMessage)
        }
        setNewMessage('')
        return
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        setNewMessage((prev) => prev.slice(0, -1))
        return
      }

      // Only allow printable characters
      if (e.key.length === 1) {
        setNewMessage((prev) => prev + e.key)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [newMessage, isConnected, sendMessage, onMessage])

  return (
    <div className="flex flex-col h-3/5 w-full bg-background text-foreground antialiased">
      {/* Messages */}
      <div ref={containerRef} className="flex flex-col justify-end flex-1 overflow-y-hidden">
        {' '}
        {allMessages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">Let the Duel begin!</div>
        ) : null}
        <div className="space-y-1">
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null
            const showHeader = !prevMessage || prevMessage.username !== message.username

            return (
              <div key={message.id} className="animate-in fade-in slide-in-from-top-4 duration-380">
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.username === username}
                  showHeader={showHeader}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div
        className={cn(
          'w-full my-4 text-center min-h-[40px] px-3 py-2 transition-all duration-300',
          !isConnected && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isSpell(newMessage) ? (
          <span className="bg-linear-295 from-indigo-600 to-indigo-800 text-white rounded-md px-3 py-2 ">
            {newMessage}
          </span>
        ) : newMessage ? (
          <span className="bg-black text-white rounded-md px-3 py-2 ">{newMessage}</span>
        ) : (
          <span className="text-muted-foreground">Type to cast a spell...</span>
        )}
      </div>
    </div>
  )
}
