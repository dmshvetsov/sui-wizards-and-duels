import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5'
import { SuiClient, getFullnodeUrl } from 'npm:@mysten/sui/client'
import { Ed25519Keypair } from 'npm:@mysten/sui/keypairs/ed25519'
import { Transaction } from 'npm:@mysten/sui/transactions'

// --- Supabase Setup ---
const supabase = createClient(
  // these env vars available in edge function by default
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// --- Network Validation ---
const NETWORK = Deno.env.get('NETWORK')?.toLowerCase()
const TWO_SUI_IN_MIST = 2_000_000_000
const ALLOWED_NETWORKS: Record<string, string> = {
  testnet: getFullnodeUrl('testnet'),
  devnet: getFullnodeUrl('devnet'),
}

if (!NETWORK) {
  throw new Error(`missing NETWORK`)
}
if (!(NETWORK in ALLOWED_NETWORKS)) {
  throw new Error(`Invalid NETWORK: "${NETWORK}". Allowed: testnet, devnet`)
}

// --- Load Treasury Keypair ---
const treasuryPk = Deno.env.get('TREASURY_KEYPAIR_JSON')
if (!treasuryPk) {
  throw new Error('Missing TREASURY_KEYPAIR_JSON environment variable')
}

let treasuryKeypair: Ed25519Keypair
try {
  treasuryKeypair = Ed25519Keypair.fromSecretKey(treasuryPk)
} catch {
  throw new Error('Failed to parse keypair configuration')
}

// --- Sui Client Setup ---
const client = new SuiClient({ url: ALLOWED_NETWORKS[NETWORK] })

serve(async (req) => {
  // TOOD: authenticate request
  try {
    if (req.method !== 'POST') {
      return jsonResponse({ message: 'Method Not Allowed' }, 405)
    }

    const authHeader = req.headers.get('Authorization')!
    if (!authHeader) {
      return jsonResponse({ message: 'Unauthenticated' }, 401)
    }

    const { address } = await req.json()
    if (!address || typeof address !== 'string') {
      return jsonResponse({ message: 'Missing or invalid sui_address' }, 400)
    }

    const token = authHeader.replace('Bearer ', '')
    const { data, error: getUserErr } = await supabase.auth.getUser(token)

    if (getUserErr) {
      return jsonResponse({ message: 'Unauthorized' }, 403)
    }

    const { data: user } = await supabase
      .from('user_accounts')
      .select('sui_address')
      .eq('sui_address', address)
      .eq('user_id', data.user.id)
      .single()

    if (!user) {
      // Silently ignore
      return jsonResponse({ message: 'OK' }, 200)
    }

    // Step 2: Check if already funded
    const { data: funded } = await supabase
      .from('user_funding')
      .select('sui_address')
      .eq('sui_address', address)
      .single()

    if (funded) {
      // Silently ignore
      return jsonResponse({ message: 'OK' }, 200)
    }

    const tx = new Transaction()
    tx.setSender(treasuryKeypair.getPublicKey().toSuiAddress())
    tx.setGasPrice(1_000)
    tx.setGasBudget(2_500_000)
    const [coins] = tx.splitCoins(tx.gas, [TWO_SUI_IN_MIST])
    tx.transferObjects([coins], address)

    const res = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: treasuryKeypair,
      options: { showEffects: true },
    })

    if (!res.effects?.status?.status || res.effects.status.status !== 'success') {
      console.error('Transfer failed', res)
      return jsonResponse({ message: 'Funding failed', txDigest: tx.digest }, 500)
    }

    await supabase.from('user_funding').insert({ sui_address: address })

    return jsonResponse({ message: 'Funded successfully', txDigest: tx.digest }, 200)
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message)
      if (err.message.match(/No valid gas coins found/)) {
        return jsonResponse({ message: 'Try again later' }, 503)
      }
    }
    console.error('Unexpected error:', err)
    return jsonResponse({ message: 'Internal Server Error' }, 500)
  }
})

function jsonResponse(result: Record<string | number, unknown>, status: number) {
  return new Response(JSON.stringify({ result }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
