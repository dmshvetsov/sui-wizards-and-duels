-------------------------------------------------------------------------------
-- claim_signup_reward ---------------------------------------------------------
-------------------------------------------------------------------------------
-- Grants signup reward (50 ESNC) if not already claimed.
-- Inserts into users_rewards and updates reward_points atomically.
CREATE OR REPLACE FUNCTION public.claim_signup_reward(
  p_sui_address text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_exists boolean;
BEGIN
  -- acquire advisory lock per address to prevent concurrent claims
  PERFORM pg_advisory_xact_lock(hashtext(p_sui_address));

  -- check if signup already rewarded
  SELECT TRUE INTO v_exists FROM users_rewards
   WHERE sui_address = p_sui_address AND activity = 'signup';

  IF v_exists THEN
    RETURN; -- nothing to do
  END IF;

  -- upsert reward points
  INSERT INTO reward_points (sui_address, points)
  VALUES (p_sui_address, 50)
  ON CONFLICT (sui_address) DO UPDATE
  SET points = reward_points.points + 50;

  -- log activity
  INSERT INTO users_rewards (sui_address, activity, value)
  VALUES (p_sui_address, 'signup', NULL);
END;
$$;