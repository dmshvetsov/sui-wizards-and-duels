import { createRemoteJWKSet, jwtVerify } from "npm:jose";

const JWKS_URL = Deno.env.get("JWKS_URL");
const jwks = createRemoteJWKSet(new URL(JWKS_URL!));

export async function validateToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, jwks);
    return { valid: true, userId: payload.sub };
  } catch (error) {
    return { valid: false, error };
  }
}