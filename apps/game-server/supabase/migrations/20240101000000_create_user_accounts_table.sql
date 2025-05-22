CREATE TABLE IF NOT EXISTS public.user_accounts (
  sui_address TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  display_name TEXT
);

-- Enable RLS
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to user_accounts"
  ON public.user_accounts
  FOR SELECT
  USING (true);

-- Create policy for insert/update
CREATE POLICY "Allow anon insert to user_accounts"
  ON public.user_accounts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anon update to user_accounts"
  ON public.user_accounts
  FOR UPDATE
  USING (true);

-- Create function to update updated_at on user_accounts update
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_accounts_updated_at ON public.user_accounts;
CREATE TRIGGER update_user_accounts_updated_at
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
