import { Ed25519Keypair } from "npm:@mysten/sui/keypairs/ed25519";
import { createClient } from "npm:@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getUserKeyPair(userId: string): Promise<Ed25519Keypair> {
  // Check if user already has a keypair
  const { data, error } = await supabase
    .from("user_keys")
    .select("private_key")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGSQL_ERROR_NO_DATA_FOUND") {
    throw new Error(`Failed to retrieve key: ${error.message}`);
  }

  // If user has a keypair, return it
  if (data?.private_key) {
    return Ed25519Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(data.private_key)),
      { skipValidation: true }
    );
  }

  // Otherwise, create a new keypair
  const newKeypair = new Ed25519Keypair();
  const privateKeyBytes = Array.from(newKeypair.getSecretKey());
  
  // Store the new keypair
  const { error: insertError } = await supabase
    .from("user_keys")
    .insert({
      user_id: userId,
      private_key: JSON.stringify(privateKeyBytes),
      public_key: newKeypair.getPublicKey().toBase64(),
      created_at: new Date().toISOString()
    });

  if (insertError) {
    throw new Error(`Failed to store key: ${insertError.message}`);
  }

  return newKeypair;
}