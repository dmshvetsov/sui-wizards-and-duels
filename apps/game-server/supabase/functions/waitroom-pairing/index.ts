import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const CHANNEL = Object.freeze({ WAITROOM: 'waitroom' })

interface WaitroomPresenceState {
  user_id: string
  joined_at: number
  nonce: number
}

interface WaitroomPlayer {
  id: string
  joinedAt: number
}

Deno.serve(async (_req) => {
  try {
    // Get Supabase URL and service role key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase client with the service role key for admin privileges
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const waitroom = supabase.channel(CHANNEL.WAITROOM, { config: { presence: { key: 'server' } } })

    waitroom.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('joined', key, newPresences)
    })
    waitroom.on('presence', { event: 'sync' }, () => {
      const presenceState = waitroom.presenceState<WaitroomPresenceState>()
      console.log('sync waitroom presence', presenceState)
      const players: WaitroomPlayer[] = []
      for (const [id, presences] of Object.entries(presenceState)) {
        const playerPresence = presences.at(0)
        if (playerPresence) {
          players.push({ id, joinedAt: playerPresence.joined_at })
        }
      }

      // Create pairs of players
      players.sort((a, b) => a.joinedAt - b.joinedAt)
      const pairs: [WaitroomPlayer, WaitroomPlayer][] = []
      for (let i = 0; i < players.length - 1; i += 2) {
        if (i + 1 < players.length) {
          pairs.push([players[i], players[i + 1]])
        }
      }
      console.log('presence pairs', pairs)

      // TODO refactor to allSettled
      const pairingData = pairs.map(([player1, player2]) => {
        const duelLink = `/d/new/${player1.id}/vs/${player2.id}`
        return {
          user1: player1.id,
          user2: player2.id,
          duelLink,
        }
      })

      // Send a broadcast message to the waitroom channel
      supabase
        .channel(CHANNEL.WAITROOM)
        .send({
          type: 'broadcast',
          event: 'pairing',
          payload: {
            pairs: pairingData,
          },
        })
        .then((res) => {
          if (res === 'error') {
            console.error('Error broadcasting pairing message')
            return { success: false, error: 'message broadcast error' }
          }

          console.log('send success response')
          return new Response(
            JSON.stringify({
              success: true,
              message: `Paired ${pairs.length} sets of players`,
              pairs: pairingData,
            }),
            { headers: { 'Content-Type': 'application/json' } }
          )
        })
        // TODO disconnect from the channel
    })

    waitroom.subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        console.error('Failed to subscribe to waitroom channel')
        // return new Response(JSON.stringify({ error: 'Internal server error' }), {
        //   status: 500,
        //   headers: { 'Content-Type': 'application/json' },
        // })
      }

      console.log('Subscribed to waitroom channel')
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
