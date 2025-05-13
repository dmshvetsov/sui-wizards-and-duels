import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js'
import { getNetwork, verifySignature } from './signature.ts'
import { createCustomJwt } from './jwt-creator.ts'

import 'jsr:@std/dotenv/load'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const CHAIN = 'sui'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    // Handle CORS preflight requests
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(null, { status: 405 });
  }

  try {
    const { 
      walletAddress, 
      signature, 
      message, 
    } = await req.json();

    if (!walletAddress || !signature || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const isValid = await verifySignature(walletAddress, message, signature);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    let { data: user, error: userError } = await supabaseAdmin
      .from('wallet_users')
      .select('id, wallet_address, nonce')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError && userError.code !== 'PGSQL_ERROR_NO_DATA_FOUND') {
      throw userError;
    }

    if (!user) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('wallet_users')
        .insert([{ wallet_address: walletAddress }])
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    const token = await createCustomJwt(user.id, walletAddress, getNetwork(), CHAIN);

    return new Response(
      JSON.stringify({ 
        token,
        user: {
          id: user.id,
          wallet_address: walletAddress,
          chain: CHAIN
        }
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in wallet authentication:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
