CREATE TABLE IF NOT EXISTS public.user_accounts (
  sui_address TEXT PRIMARY KEY CHECK (sui_address ~ '^0x[a-fA-F0-9]{64}$'),
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
CREATE POLICY "Allow users to insert their own account"
  ON public.user_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own account"
  ON public.user_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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
