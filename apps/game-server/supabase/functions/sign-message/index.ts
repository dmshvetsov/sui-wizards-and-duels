// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { validateToken } from "../../../services/jwt_validator.ts";
import { getUserKeyPair } from "../../../services/key_manager.ts";

Deno.serve(async (req) => {
  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.split(' ')[1];
    const { valid, userId, error } = await validateToken(token);
    
    if (!valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { message } = await req.json();
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user's keypair
    const keypair = await getUserKeyPair(userId);
    
    // Sign the message
    const messageBytes = new TextEncoder().encode(message);
    const signature = await keypair.signPersonalMessage(messageBytes);

    return new Response(
      JSON.stringify({
        signature: signature.signature,
        publicKey: keypair.getPublicKey().toBase64(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error signing message:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});