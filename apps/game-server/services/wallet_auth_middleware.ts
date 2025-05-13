import { jwtVerify } from "npm:jose@4.14.4";

export async function verifyWalletAuthToken(token: string) {
  try {
    // Get the JWT secret from environment variables
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    // Convert the secret to Uint8Array
    const secretKey = new TextEncoder().encode(jwtSecret);

    // Verify the token
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: 'wallet-auth',
      audience: 'authenticated'
    });

    return {
      valid: true,
      userId: payload.sub,
      walletAddress: payload.wallet_address,
      chain: payload.chain
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false, error: error.message };
  }
}