-------------------------------------------------------------------------------
-- claim_daily_checkin ---------------------------------------------------------
-------------------------------------------------------------------------------
-- Atomically grants the player their daily check-in reward.
-- Ensures the user has not yet checked in today, inserts a log into
-- users_rewards and updates reward_points in a single transaction.
-- Returns the new_points balance after the reward is applied.

CREATE OR REPLACE FUNCTION public.claim_daily_checkin(
  p_sui_address text,
  p_today date
) RETURNS TABLE (new_points integer)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_existing_points integer := 0;
BEGIN
  -- Prevent double claims ------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM users_rewards
    WHERE sui_address = p_sui_address
      AND activity = 'daily-checkin'
      AND value = p_today::text
  ) THEN
    RAISE EXCEPTION 'Already claimed today';
  END IF;

  -- Lock the points row to avoid race conditions ------------------------------
  PERFORM 1 FROM reward_points WHERE sui_address = p_sui_address FOR UPDATE;

  -- Fetch current points -------------------------------------------------------
  SELECT points INTO v_existing_points FROM reward_points WHERE sui_address = p_sui_address;
  IF v_existing_points IS NULL THEN
    v_existing_points := 0;
  END IF;

  new_points := v_existing_points + 10;

  -- Upsert new balance ---------------------------------------------------------
  INSERT INTO reward_points (sui_address, points)
  VALUES (p_sui_address, new_points)
  ON CONFLICT (sui_address) DO UPDATE
  SET points = EXCLUDED.points;

  -- Log the check-in -----------------------------------------------------------
  INSERT INTO users_rewards (sui_address, activity, value)
  VALUES (p_sui_address, 'daily-checkin', p_today::text);

  RETURN NEXT;
END;
$$;
