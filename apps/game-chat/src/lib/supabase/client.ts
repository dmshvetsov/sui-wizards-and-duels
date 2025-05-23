import { createClient, RealtimeChannelOptions } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

const supabaseClient = createClient(supabaseUrl, supabaseKey)

export const NOT_FOUND_ERR_CODE = 'PGRST116'

export function getClient() {
  return supabaseClient
}

export const createRoom = (roomName: string, opts: RealtimeChannelOptions = { config: {} }) => {
  return getClient().channel(roomName, opts)
}
export const removeRoom = (channel: ReturnType<typeof createRoom>) => {
  return getClient().removeChannel(channel)
}

export const getMessages = (roomName: string) => {
  return getClient()
    .from('messages')
    .select()
    .eq('channel', roomName)
    .range(0, 49)
    .order('id', { ascending: false })
}

export const createMessage = async ({
  text,
  username,
  channel,
}: {
  text: string
  username: string
  channel: string
}) => {
  return await getClient().from('messages').insert({
    text,
    username,
    channel,
  })
}
