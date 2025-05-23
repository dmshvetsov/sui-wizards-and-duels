import { cn } from '@/lib/utils'
import { displayName, isSpell, type ChatMessage } from '@/lib/message'

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
        <div className="relative mx-2 w-auto">
          {isSpell(message) && (
            <div className="absolute inset-px transitiona-all duration-1000 bg-gradient-to-r from-indigo-700 via-orange-700 to-indigo-500 rounded-full blur-xs animate-pulse"></div>
          )}
          <div
            className={cn(
              'relative items-center justify-center relative py-2 px-3 rounded-md text-sm w-fit',
              {
                'bg-primary text-primary-foreground': isOwnMessage && !isSpell(message),
                'bg-muted text-foreground': !isOwnMessage && !isSpell(message),
                'bg-linear-65 from-orange-600 to-orange-800 text-primary-foreground border-1 border-orange-600': isSpell(message) && !isOwnMessage,
                'bg-linear-295 from-indigo-600 to-indigo-800 text-primary-foreground border-1 border-indigo-600': isSpell(message) && isOwnMessage,
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
