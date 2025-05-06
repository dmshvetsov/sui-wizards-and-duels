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

// Listen for shutdown events to clean up resources
addEventListener('beforeunload', (_event) => {
  console.log('Function will be shutdown')
  // Could add cleanup logic here if needed
})

/**
 * Background task that handles the pairing logic
 */
function handlePairing(): Promise<void> {
  try {
    console.log('Starting background pairing task')

    // Get Supabase URL and service role key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return Promise.reject(new Error('supabase configuration error'))
    }

    // Create Supabase client with the service role key for admin privileges
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create a promise that will resolve when the pairing is complete
    return new Promise((resolve, reject) => {
      const waitroom = supabase.channel(CHANNEL.WAITROOM, { config: { presence: { key: 'server' } } })

      waitroom.on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('joined', newPresences)
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
        const pairingPayload = pairs.map(([player1, player2]) => {
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
              pairs: pairingPayload,
            },
          })
          .then((res) => {
            if (res === 'error') {
              console.error('Error broadcasting pairing message')
              reject(new Error('Message broadcast error'))
            } else {
              console.log(`Successfully paired ${pairs.length} sets of players`)
              resolve()
            }

            // Disconnect from the channel
            supabase.removeChannel(waitroom)
          })
          .catch((err) => {
            console.error('Error in pairing process:', err)
            reject(err)

            // Disconnect from the channel
            supabase.removeChannel(waitroom)
          })
      })

      waitroom.subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to waitroom channel')
          reject(new Error('Failed to subscribe to waitroom channel'))
          return
        }

        console.log('Subscribed to waitroom channel')
      })
    })
  } catch (error) {
    console.error('Unexpected error in background task:', error)
    throw error
  }
}

// HTTP handler that responds immediately and runs pairing in the background
Deno.serve((_req) => {
  try {
    // Start the pairing process as a background task
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    self.EdgeRuntime.waitUntil(handlePairing())

    // Respond immediately
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pairing process started in the background',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 202 // Accepted
      }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
