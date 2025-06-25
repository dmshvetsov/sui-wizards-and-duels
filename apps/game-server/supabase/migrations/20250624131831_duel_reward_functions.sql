-------------------------------------------------------------------------------
-- claim_duel_reward ----------------------------------------------------------
-------------------------------------------------------------------------------
-- Atomically grants the player their duel rewards.
-- Inserts rows into users_rewards and updates reward_points.
-- Returns total_reward granted and new_points balance.
CREATE OR REPLACE FUNCTION public.claim_duel_reward(
  p_sui_address text,
  p_duel_id text,
  p_opponent text,
  p_during_slot boolean
) RETURNS TABLE (total_reward integer, new_points integer)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reward integer := 0;
  v_existing_points integer := 0;
BEGIN
  -- lock the points row to avoid race conditions
  PERFORM 1 FROM reward_points WHERE sui_address = p_sui_address FOR UPDATE;

  -- Participation reward -----------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM users_rewards
    WHERE sui_address = p_sui_address
      AND activity = 'duel-participation'
      AND value = p_duel_id
  ) THEN
    INSERT INTO users_rewards (sui_address, activity, value)
    VALUES (p_sui_address, 'duel-participation', p_duel_id);
    v_reward := v_reward + 10;
  END IF;

  -- New opponent bonus -------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM users_rewards
    WHERE sui_address = p_sui_address
      AND activity = 'duel-against-new-opponent'
      AND value = p_opponent
  ) THEN
    INSERT INTO users_rewards (sui_address, activity, value)
    VALUES (p_sui_address, 'duel-against-new-opponent', p_opponent);
    v_reward := v_reward + 10;
  END IF;

  -- Duelground slot bonus ----------------------------------------------------
  IF p_during_slot THEN
    IF NOT EXISTS (
      SELECT 1 FROM users_rewards
      WHERE sui_address = p_sui_address
        AND activity = 'duel-during-duelground-gathering'
        AND value = p_duel_id
    ) THEN
      INSERT INTO users_rewards (sui_address, activity, value)
      VALUES (p_sui_address, 'duel-during-duelground-gathering', p_duel_id);
      v_reward := v_reward + 10;
    END IF;
  END IF;

  -- Update / insert reward points -------------------------------------------
  SELECT points INTO v_existing_points FROM reward_points WHERE sui_address = p_sui_address;
  IF v_existing_points IS NULL THEN
    v_existing_points := 0;
  END IF;

  new_points := v_existing_points + v_reward;

  INSERT INTO reward_points (sui_address, points)
  VALUES (p_sui_address, new_points)
  ON CONFLICT (sui_address) DO UPDATE
  SET points = EXCLUDED.points;

  total_reward := v_reward;
  RETURN NEXT;
END;
$$;