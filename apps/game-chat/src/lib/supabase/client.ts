import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const createRoom = (roomName: string) => {
  return supabase.channel(roomName);
};
export const removeRoom = (channel: ReturnType<typeof createRoom>) => {
  return supabase.removeChannel(channel);
};

export const getMessages = () => {
  return supabase.from('messages').select().range(0, 49).order('id', { ascending: false });
};

export const createMessage = async ({ text, username }: { text: string; username: string }) => {
  return await supabase.from('messages').insert({
    text,
    username,
  });
};
