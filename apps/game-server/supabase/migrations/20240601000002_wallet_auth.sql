-- Create wallet users table
CREATE TABLE IF NOT EXISTS public.wallet_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  nonce TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.wallet_users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own data
CREATE POLICY "Users can view own wallet data" 
  ON public.wallet_users 
  FOR SELECT 
  USING (auth.uid() = id);

-- Create function to update the timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the timestamp
CREATE TRIGGER update_wallet_users_updated_at
  BEFORE UPDATE ON public.wallet_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
