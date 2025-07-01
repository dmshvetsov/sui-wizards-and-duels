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

type LogMessageOptions = {
  event: 'spell-casted',
  spellName: string
} | {
  event: 'force-used'
  amount: number
} | {
  event: 'spell-prepared'
  spellName: string
}

function formatSpellMessage(spellName: string): string {
  switch(spellName) {
    case 'choke':
      return `has been choked`
    case 'throw':
      return `has been thrown`
    case 'deflect':
      return `got deflect protection`
    case 'arrow':
      return `got 12 force damage`
    default:
      return `[unknow spell]`
  }
}

export function logMessage(
  usernameAffected: string, 
  params?: LogMessageOptions
): ChatMessage {
  let messageText = ''
  
  if (params) {
    switch (params.event) {
      case 'spell-casted':
        messageText = formatSpellMessage(params.spellName)
        break
      case 'force-used':
        messageText = `used ${params.amount} force`
        break
      case 'spell-prepared':
        messageText = `preparing ${params.spellName}`
        break
    }
  }

  return {
    id: crypto.randomUUID(),
    text: messageText,
    username: usernameAffected,
    channel: LOG_CHANNEL,
    timestamp: new Date().toISOString(),
  }
}
