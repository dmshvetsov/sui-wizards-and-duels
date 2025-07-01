import { cn } from '@/lib/utils'
import { displayName, isSpell, isLog, type ChatMessage } from '@/lib/message'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
}

export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
  return (
    <div className={`flex mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={cn('max-w-[75%] w-fit flex flex-col gap-1', {
          'items-end': isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn('flex items-center gap-2 text-xs', {
              'justify-end flex-row-reverse': isOwnMessage,
            })}
          >
            <span className="font-medium">{isOwnMessage ? 'you' : displayName(message)}</span>
          </div>
        )}
        <div className="relative mx-2 w-fit">
          <div
            className={cn(
              'relative items-center justify-center relative py-2 px-3 rounded-md text-sm w-fit',
              {
                'bg-primary text-primary-foreground': isOwnMessage && !isSpell(message),
                'bg-muted text-foreground': !isOwnMessage && !isSpell(message),
                'bg-transparent text-foreground py-0': isLog(message),
                'italic text-black font-bold': isSpell(message) && !isOwnMessage,
                'italic text-indigo-800 font-bold':
                  isSpell(message) && isOwnMessage,
              }
            )}
          >
            {message.text}
          </div>
        </div>
      </div>
    </div>
  )
}
