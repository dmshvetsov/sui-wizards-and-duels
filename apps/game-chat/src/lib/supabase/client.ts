import { createClient, RealtimeChannelOptions } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export const createRoom = (roomName: string, opts: RealtimeChannelOptions = { config: {} }) => {
  return supabase.channel(roomName, opts)
}
export const removeRoom = (channel: ReturnType<typeof createRoom>) => {
  return supabase.removeChannel(channel)
}

export const getMessages = (roomName: string) => {
  return supabase.from('messages').select().eq('duel', roomName).range(0, 49).order('id', { ascending: false })
}

export const createMessage = async ({
  text,
  username,
  duel,
}: {
  text: string
  username: string
  duel: string
}) => {
  return await supabase.from('messages').insert({
    text,
    username,
    duel,
  })
}
