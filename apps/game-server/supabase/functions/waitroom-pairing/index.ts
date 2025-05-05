import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const CHANNEL = Object.freeze({ WAITROOM: 'waitroom' })

interface WaitroomPresenceState {
  [key: string]: {
    user_id: string
    joined_at: number
    nonce: number
  }[]
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

    const waitroom = supabase.channel(CHANNEL.WAITROOM)

    const presenceState = waitroom.presenceState<WaitroomPresenceState>();
    const players: WaitroomPlayer[] = [];
    for (const [id, presences] of Object.entries(presenceState)) {
      if (presences.length) {
        players.push({ id, joinedAt: presences[0].joined_at })
        
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

    // Send messages to each pair with the duel link
    const pairingResults = await Promise.all(
      pairs.map(async ([player1, player2]) => {
        const duelLink = `/d/new/${player1.id}/vs/${player2.id}`

        // Send a broadcast message to the waitroom channel
        const waitRoomSendRes = await supabase.channel(CHANNEL.WAITROOM).send({
          type: 'broadcast',
          event: 'pairing',
          payload: {
            player1Id: player1.id,
            player2Id: player2.id,
            duelLink,
          },
        })

        if (waitRoomSendRes === 'error') {
          console.error('Error broadcasting pairing message')
          return { success: false, error: 'message broadcast error' }
        }

        return {
          success: true,
          player1Id: player1.id,
          player2Id: player2.id,
          duelLink,
        }
      })
    )

    return new Response(
      JSON.stringify({
        success: true,
        message: `Paired ${pairs.length} sets of players`,
        pairs: pairingResults,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
