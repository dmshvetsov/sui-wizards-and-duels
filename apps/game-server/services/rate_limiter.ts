import { connect } from "npm:redis";

const RATE_LIMIT_WINDOW = 60; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute

// Connect to Redis
const redis = await connect({
  hostname: Deno.env.get("REDIS_HOST") || "localhost",
  port: parseInt(Deno.env.get("REDIS_PORT") || "6379"),
  password: Deno.env.get("REDIS_PASSWORD"),
});

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:sign_message:${userId}`;
  
  // Get current count
  const currentCount = parseInt(await redis.get(key) || "0");
  
  if (currentCount >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  
  // Increment count
  const newCount = await redis.incr(key);
  
  // Set expiry if this is the first request in the window
  if (newCount === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW);
  }
  
  // Get TTL to calculate reset time
  const ttl = await redis.ttl(key);
  
  return { 
    allowed: true, 
    remaining: MAX_REQUESTS_PER_WINDOW - newCount 
  };
}