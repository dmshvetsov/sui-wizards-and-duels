-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS rate_limits_user_endpoint_idx 
  ON public.rate_limits (user_id, endpoint);

-- Add index for faster cleanup
CREATE INDEX IF NOT EXISTS rate_limits_expires_at_idx 
  ON public.rate_limits (expires_at);

-- Add RLS policies
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow the service role to access this table
CREATE POLICY "Service role can manage rate_limits" 
  ON public.rate_limits 
  USING (auth.role() = 'service_role');

-- Create a function to clean up expired rate limits
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the cleanup function every 5 minutes
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-rate-limits',           -- unique job name
  '*/5 * * * *',                   -- every 5 minutes (cron expression)
  $$SELECT public.cleanup_expired_rate_limits()$$
);
