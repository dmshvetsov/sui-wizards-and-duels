import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/chat-message'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { useRealtimeChat } from '@/hooks/use-realtime-chat'
import { type ChatMessage } from '@/lib/message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Wand } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface RealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: string) => void
  onIncommingMessage?: (message: string) => void
  messages?: ChatMessage[]
}

/**
 * Real-time chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages.
 * @param onIncommingMessage - The callback function to handle the incomming messages.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat = ({
  roomName,
  username,
  onMessage,
  onIncommingMessage,
  messages: initialMessages = [],
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
  } = useRealtimeChat({
    roomName,
    username,
    onIncommingMessage,
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

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !isConnected) return

      sendMessage(newMessage)
      if (onMessage) {
        onMessage(newMessage)
      }
      setNewMessage('')
    },
    [newMessage, isConnected, sendMessage, onMessage]
  )

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

      <form onSubmit={handleSendMessage} className="flex w-full gap-2 border-t border-border p-4">
        <Input
          autoFocus
          className={cn(
            'rounded-full bg-background text-sm transition-all duration-300',
            isConnected && newMessage.trim() ? 'w-[calc(100%-36px)]' : 'w-full'
          )}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type to cast a spell..."
          disabled={!isConnected}
        />
        {isConnected && newMessage.trim() && (
          <Button
            disableSfx
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
            disabled={!isConnected}
          >
            <Wand className="size-4" />
          </Button>
        )}
      </form>
    </div>
  )
}
