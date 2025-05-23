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

export function isSpell(message: ChatMessage): boolean {
  const text = message.text.trim()
  return text[0] === '@' || text[0] === '!'
}
