import { createClient } from "npm:@supabase/supabase-js";

const RATE_LIMIT_WINDOW = 60; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  // Clean up expired entries first (optional, can be done by a scheduled job instead)
  await supabase
    .from('rate_limits')
    .delete()
    .lt('expires_at', new Date().toISOString());
  
  // Count recent requests
  const { count, error: countError } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', 'sign_message');
  
  if (countError) {
    console.error('Error checking rate limit:', countError);
    // Fail open - allow the request if we can't check the rate limit
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW };
  }
  
  const currentCount = count || 0;
  
  if (currentCount >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  
  // Record this request
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + RATE_LIMIT_WINDOW);
  
  const { error: insertError } = await supabase
    .from('rate_limits')
    .insert({
      user_id: userId,
      endpoint: 'sign_message',
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    });
  
  if (insertError) {
    console.error('Error recording rate limit:', insertError);
  }
  
  return { 
    allowed: true, 
    remaining: MAX_REQUESTS_PER_WINDOW - currentCount - 1 
  };
}