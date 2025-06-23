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
  return DUELGROUND_SLOTS.some(slot => hour >= slot.start && hour < slot.end)
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
      .eq('activity', 'daily_checkin')
      .eq('value', today)
      .maybeSingle()
    if (req.method === 'GET') {
      return jsonResponse({ claimed: !!alreadyClaimed, nextAvailable: today }, 200)
    }
    if (req.method !== 'POST') {
      return jsonResponse({ message: 'Method Not Allowed' }, 405)
    }
    // POST: claim logic
    const now = new Date()
    if (!isWithinDuelgroundSlot(now)) {
      return jsonResponse({ message: 'Not within Duelground slot' }, 403)
    }
    if (alreadyClaimed) {
      return jsonResponse({ message: 'Already claimed today' }, 409)
    }
    // Get current points
    const { data: pointsRow } = await supabase
      .from('reward_points')
      .select('points')
      .eq('sui_address', sui_address)
      .maybeSingle()
    let newPoints = 10
    if (pointsRow && typeof pointsRow.points === 'number') {
      newPoints = Math.min(pointsRow.points + 10, 5000)
    }
    // Upsert points
    await supabase.from('reward_points').upsert(
      {
        sui_address,
        points: newPoints,
      },
      { onConflict: ['sui_address'] }
    )
    // Log the activity
    await supabase.from('users_rewards').insert({
      sui_address,
      activity: 'daily_checkin',
      value: today,
    })
    return jsonResponse({ message: 'Daily check-in successful', points: newPoints }, 200)
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