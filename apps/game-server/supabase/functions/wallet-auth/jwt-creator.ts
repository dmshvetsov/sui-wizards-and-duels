import { SignJWT } from 'npm:jose@4.14.4'
import { Chain, Network } from './constants.ts'

export function createCustomJwt(
  userId: string,
  walletAddress: string,
  network: Network,
  chain: Chain
): Promise<string> {
  // Get the JWT secret from environment variables
  const jwtSecret = Deno.env.get('JWT_SECRET')
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }

  // Convert the secret to Uint8Array
  const secretKey = new TextEncoder().encode(jwtSecret)

  // Current time in seconds
  const now = Math.floor(Date.now() / 1000)

  // Create and sign the JWT
  return new SignJWT({
    role: 'authenticated',
    sub: userId,
    wallet_address: walletAddress,
    network,
    chain,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + 600) // 10 minutes
    .setIssuer('wallet-auth')
    .setAudience('authenticated')
    .sign(secretKey)
}
