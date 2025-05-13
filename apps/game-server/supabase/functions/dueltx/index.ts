// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { Ed25519Keypair, Ed25519PublicKey } from 'npm:@mysten/sui/keypairs/ed25519'
import { MultiSigPublicKey } from 'npm:@mysten/sui/multisig'

import 'jsr:@std/dotenv/load'

Deno.serve(async (req) => {
  const { name, publicKey: public64Addres } = await req.json()
  const message = new TextEncoder().encode(`Hello ${name}`)

  const autoSignerKeyPair = Ed25519Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(Deno.env.get('APK') || '')),
    { skipValidation: true }
  )
  const playerPubKey = new Ed25519PublicKey(public64Addres)

  const multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
    threshold: 1,
    publicKeys: [
      {
        publicKey: autoSignerKeyPair.getPublicKey(),
        weight: 1,
      },
      {
        publicKey: playerPubKey,
        weight: 1,
      },
    ],
  })

  const signer = multiSigPublicKey.getSigner(autoSignerKeyPair)
  const { signature } = await signer.signPersonalMessage(message)

  return new Response(
    JSON.stringify({
      ok: true,
      signature,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
})
