import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5'
import { SuiClient, getFullnodeUrl } from 'npm:@mysten/sui/client'
import { corsHeaders } from '../_shard/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const NETWORK = Deno.env.get('NETWORK')?.toLowerCase() || 'testnet'
const SUI_RPC_URL = getFullnodeUrl(NETWORK)
const suiClient = new SuiClient({ url: SUI_RPC_URL })

const DUELGROUND_SLOTS = [
  { start: 11, end: 12 }, // 11:00-12:00 UTC
  { start: 20, end: 21 }, // 20:00-21:00 UTC
]

function isWithinDuelgroundSlot(date: Date) {
  const hour = date.getUTCHours()
  return DUELGROUND_SLOTS.some((slot) => hour >= slot.start && hour < slot.end)
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('OK', { headers: corsHeaders })
    }

    // GET check available duel rewards

    if (req.method === 'GET') {
      // Extract duelId from URL path /duel-reward/:duelId
      const pathnameParts = new URL(req.url).pathname.split('/').filter(Boolean)
      const duelId = pathnameParts[pathnameParts.length - 1]
      if (!duelId || duelId === 'duel-reward') {
        return jsonResponse({ message: 'Missing duelId in path' }, 400)
      }

      // Authenticate the caller – same as POST flow
      const auth = await ensureAuthenticatedUser(req)

      // Get user's SUI address
      const { data: userAccount } = await supabase
        .from('user_accounts')
        .select('sui_address')
        .eq('user_id', auth.user.id)
        .single()
      if (!userAccount) {
        return jsonResponse({ message: 'Unauthorized' }, 403)
      }

      // Fetch duel from chain to validate participation and gather metadata
      const { data: duelFetchResponse, error: duelFetchErr } = await suiClient.getObject({
        id: duelId,
        options: { showContent: true },
      })
      if (
        duelFetchErr ||
        !duelFetchResponse?.content ||
        duelFetchResponse.content.dataType !== 'moveObject'
      ) {
        return jsonResponse({ message: 'duel not found' }, 400)
      }
      const duel = duelFetchResponse.content.fields as any
      const wizard1 = duel.wizard1
      const wizard2 = duel.wizard2
      const started_at = Number(duel.started_at)

      // Ensure user participates in this duel
      if (userAccount.sui_address !== wizard1 && userAccount.sui_address !== wizard2) {
        return jsonResponse(
          { availableReward: 0, message: 'User not a participant in this duel' },
          200
        )
      }

      let availableReward = 0

      // 1. Participation reward
      const { data: alreadyRewarded } = await supabase
        .from('users_rewards')
        .select('id')
        .eq('sui_address', userAccount.sui_address)
        .eq('activity', 'duel-participation')
        .eq('value', duelId)
        .maybeSingle()
      if (!alreadyRewarded) {
        availableReward += 10
      }

      // 2. First duel vs new opponent bonus
      const opponent = userAccount.sui_address === wizard1 ? wizard2 : wizard1
      const { data: alreadyPaired } = await supabase
        .from('users_rewards')
        .select('id')
        .eq('sui_address', userAccount.sui_address)
        .eq('activity', 'duel-against-new-opponent')
        .eq('value', opponent)
        .maybeSingle()
      if (!alreadyPaired) {
        availableReward += 10
      }

      // 3. Duel during Duelground gathering time bonus
      const duelDate = new Date(started_at)
      if (isWithinDuelgroundSlot(duelDate)) {
        const { data: alreadySlotReward } = await supabase
          .from('users_rewards')
          .select('id')
          .eq('sui_address', userAccount.sui_address)
          .eq('activity', 'duel-during-duelground-gathering')
          .eq('value', duelId)
          .maybeSingle()
        if (!alreadySlotReward) {
          availableReward += 10
        }
      }

      return jsonResponse({ availableReward, message: 'OK' }, 200)
    }

    // POST claim rewards

    if (req.method !== 'POST') {
      return jsonResponse({ message: 'Method Not Allowed' }, 405)
    }

    const auth = await ensureAuthenticatedUser(req)
    const { duelId } = await req.json()
    if (!duelId || typeof duelId !== 'string') {
      return jsonResponse({ message: 'Missing or invalid duelId' }, 400)
    }

    // Get user's SUI address
    const { data: userAccount } = await supabase
      .from('user_accounts')
      .select('sui_address')
      .eq('user_id', auth.user.id)
      .single()
    if (!userAccount) {
      return jsonResponse({ message: 'Unauthorized' }, 403)
    }

    // Fetch duel object from chain
    const { data: duelFetchResponse, error: duelFetchErr } = await suiClient.getObject({
      id: duelId,
      options: { showContent: true },
    })
    if (
      duelFetchErr ||
      !duelFetchResponse?.content ||
      duelFetchResponse.content.dataType !== 'moveObject'
    ) {
      return jsonResponse({ message: 'duel not found' }, 400)
    }

    const duel = duelFetchResponse.content.fields as any
    const wizard1 = duel.wizard1
    const wizard2 = duel.wizard2
    const started_at = Number(duel.started_at)

    // Check user is a participant
    if (userAccount.sui_address !== wizard1 && userAccount.sui_address !== wizard2) {
      return jsonResponse({ message: 'User not a participant in this duel' }, 403)
    }

    const opponent = userAccount.sui_address === wizard1 ? wizard2 : wizard1
    const duringSlot = isWithinDuelgroundSlot(new Date(started_at))

    const { data: claimData, error: claimErr } = await supabase.rpc('claim_duel_reward', {
      p_sui_address: userAccount.sui_address,
      p_duel_id: duelId,
      p_opponent: opponent,
      p_during_slot: duringSlot,
    })

    if (claimErr) {
      console.error('claim_duel_reward error', claimErr)
      return jsonResponse({ message: 'Failed to claim duel reward' }, 500)
    }

    return jsonResponse(
      {
        message: `${claimData?.total_reward ?? 0} duel rewards granted, ${claimData?.new_points ?? 0} total points`,
        points: claimData?.new_points ?? 0,
        totalReward: claimData?.total_reward ?? 0,
      },
      200
    )
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.toLowerCase() === 'unauthenticated') {
        return jsonResponse({ message: 'Unauthenticated' }, 401)
      }
      if (err.message.toLowerCase() === 'unauthorized') {
        return jsonResponse({ message: 'Unauthorized' }, 403)
      }
    }
    console.error('Unexpected error:', err)
    return jsonResponse({ message: 'Internal Server Error' }, 500)
  }
})

function jsonResponse(result: Record<string | number, unknown>, status: number) {
  return new Response(JSON.stringify({ result }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function ensureAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('unauthenticated')
  }
  const token = authHeader.replace('Bearer ', '')
  const { data: auth, error: getUserErr } = await supabase.auth.getUser(token)
  if (getUserErr) {
    throw new Error('unauthorized')
  }
  return auth
}

