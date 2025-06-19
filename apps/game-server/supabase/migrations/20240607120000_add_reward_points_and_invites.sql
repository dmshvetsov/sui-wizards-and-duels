-- 1. reward_points table
CREATE TABLE IF NOT EXISTS public.reward_points (
  sui_address TEXT PRIMARY KEY CHECK (sui_address ~ '^0x[a-fA-F0-9]{64}$'),
  points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. users_rewards table
CREATE TABLE IF NOT EXISTS public.users_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sui_address TEXT NOT NULL CHECK (sui_address ~ '^0x[a-fA-F0-9]{64}$'),
  activity TEXT NOT NULL, -- ENUM could be used, but TEXT for flexibility
  value TEXT, -- stores invite/inviter address or duel id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. invite_binds table
CREATE TABLE IF NOT EXISTS public.invite_binds (
  inviter_sui_address TEXT NOT NULL CHECK (inviter_sui_address ~ '^0x[a-fA-F0-9]{64}$'),
  invitee_sui_address TEXT NOT NULL CHECK (invitee_sui_address ~ '^0x[a-fA-F0-9]{64}$'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (inviter_sui_address, invitee_sui_address)
);

-- Enable RLS for all tables
ALTER TABLE public.reward_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_binds ENABLE ROW LEVEL SECURITY;

-- Policies: allow public read, only authenticated insert for users_rewards and invite_binds
CREATE POLICY "Allow public read access to reward_points"
  ON public.reward_points
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to users_rewards"
  ON public.users_rewards
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to invite_binds"
  ON public.invite_binds
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own rewards/activities
CREATE POLICY "Allow authenticated insert to users_rewards"
  ON public.users_rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert to invite_binds"
  ON public.invite_binds
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger to update updated_at on reward_points update
CREATE OR REPLACE FUNCTION public.update_reward_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reward_points_updated_at ON public.reward_points;
CREATE TRIGGER update_reward_points_updated_at
  BEFORE UPDATE ON public.reward_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reward_points_updated_at(); 