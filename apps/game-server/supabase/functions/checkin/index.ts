import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5'
import { corsHeaders } from '../_shard/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const DUELGROUND_SLOTS = [
  { start: 11, end: 12 }, // 11:00-12:00 UTC
  { start: 20, end: 21 }, // 20:00-21:00 UTC
]

function isWithinDuelgroundSlot(date: Date) {
  const hour = date.getUTCHours()
  return DUELGROUND_SLOTS.some((slot) => hour >= slot.start && hour < slot.end)
}

function getTodayUTC() {
  const now = new Date()
  return now.toISOString().slice(0, 10) // YYYY-MM-DD
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('OK', { headers: corsHeaders })
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
      return jsonResponse({ message: 'Method Not Allowed' }, 405)
    }

    const auth = await ensureAuthenticatedUser(req)
    const { data: userAccount } = await supabase
      .from('user_accounts')
      .select('sui_address')
      .eq('user_id', auth.user.id)
      .single()
    if (!userAccount) {
      return jsonResponse({ message: 'User account not found' }, 404)
    }

    const sui_address = userAccount.sui_address
    const today = getTodayUTC()

    // Check if already claimed today
    const { data: alreadyClaimed } = await supabase
      .from('users_rewards')
      .select('id')
      .eq('sui_address', sui_address)
      .eq('activity', 'daily-checkin')
      .eq('value', today)
      .maybeSingle()

    if (req.method === 'GET') {
      return jsonResponse({ claimed: !!alreadyClaimed, nextAvailable: today }, 200)
    }

    // POST: claim logic

    const now = new Date()
    if (!isWithinDuelgroundSlot(now)) {
      return jsonResponse({ message: 'Not within Duelground slot' }, 400)
    }
    const { data: claimData, error: claimErr } = await supabase
      .rpc('claim_daily_checkin', {
        p_sui_address: sui_address,
        p_today: today,
      })
      .single()

    if (claimErr) {
      console.error('claim_daily_checkin error', claimErr)
      // If the function indicates user has already checked in today
      if (claimErr.message?.toLowerCase().includes('already')) {
        return jsonResponse({ message: 'Already checked in today' }, 400)
      }
      return jsonResponse({ message: 'Failed to claim daily check-in' }, 500)
    }

    return jsonResponse(
      {
        message: `Daily check-in successful +10 Mint Essence. Now you have ${claimData?.new_points ?? 0} Mint Essence`,
        points: claimData?.new_points ?? 0,
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
