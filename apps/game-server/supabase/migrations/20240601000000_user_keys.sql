CREATE TABLE IF NOT EXISTS public.user_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  private_key TEXT NOT NULL,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;

-- Only allow the service role to access this table
CREATE POLICY "Service role can manage user_keys" 
  ON public.user_keys 
  USING (auth.role() = 'service_role');

-- Add audit logging
CREATE OR REPLACE FUNCTION public.log_key_usage()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_key_usage
  BEFORE UPDATE ON public.user_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.log_key_usage();