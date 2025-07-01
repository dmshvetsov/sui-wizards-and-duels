const LOG_CHANNEL = 'log'

export interface ChatMessage {
  id: string
  text: string
  username: string
  channel: string
  timestamp: string
}

export function displayName(message: ChatMessage) {
  const address = message.username
  if (address.length > 18) {
    return address.slice(0, 6) + '..' + address.slice(-4)
  }
  return address
}

export function isSpell(message: ChatMessage | string): boolean {
  const text = typeof message === 'string' ? message : message.text.trim()
  return text[0] === '@' || text[0] === '!'
}

export function isLog(message: ChatMessage): boolean {
  return message.channel === LOG_CHANNEL
}

export function logMessage(username: string, text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    text,
    username,
    channel: LOG_CHANNEL,
    timestamp: new Date().toISOString(),
  }
}
