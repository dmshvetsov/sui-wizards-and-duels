# Wizards and Duels game Reward points spec

Rewards points name "Mint Essence", short name ESNC

## About Mint Essence (ESNC)

Burned in the Arcforge to summon OG Wizards

Can never be bought or traded — only earned

Generated from duels, alliances, and honor

✨ Lore of the Mint Essence & the Arcforge

In the beginning, there was only raw Force... drifting across the realms unseen.
When the Astral War shattered the Veil, fragments of ancient magic crystallized into what sages now call Mint Essence — a rare soulbound energy that clings only to those who duel with purpose.

This ethereal substance cannot be traded, sold, or stolen. It binds to the very will of its bearer — earned only in combat, loyalty, and through bonds forged in the Crucible of Duels. It is whispered that those who gather enough of this essence may invoke the ancient ritual known as the Arcforge.

The Arcforge is no mere minting machine — it is a forge of fate.

Fed by Mint Essence, the Arcforge consumes your soulbound victories and summons an OG Wizard. These first-born entities are known as the Original Generation, or “OGs” — unique, eternal, and irreplaceable. Their power echoes the earliest magic and will never be seen again once the ritual ends.

“When the Arcforge goes dark, no power in this world shall reignite it. Only those who rose during the Essence Era shall carry its legacy.”

## NFTnomics

Any unminted ESNC will be burned

Unsold OG Gen Wizards will be offered on mainnet for SUI

SUI mint price to be determined via price discovery

Total Supply: 5,000

Mint Price: 500 ESNC

Limit per Wallet: 10

Soulbound: Cannot transfer NFTs

Mint Deadline: Before June 30, 2025 (UTC)

## Spec

implement all the logic for adding ESNC reward points to `user_account`.

1. add `reward_points` supabase database table with `sui_address` column and `points` column
2. add `users_rewards` supabase database table with `sui_address` column, `activity` column (see list activities below), `value` (store either invite or inviter address, or duel id)
3. add `invite_binds` supabase database table with `inviter_sui_address` and `invitee_sui_address`
4. add leaderboard page with 50 top point holders, leaderboard page can be viewed without authentication (public)
5. add link in GameMenu to Leaderboard page
6. implement reward login for activities:
    1.  Signup, collect on the claim reward page
    2. Daily Check-in (during Duelground slot) 
    3. Duel (win or lose)                      
    4. First duel vs a new sui address bonus   
    5. Duel during Duelground gathering time   
    6. Referral Bind - Invitee                 
    7. Referral Bind - Inviter                 
    8. Duel by referred invitee (per duel)     

### 📈 Leaderboard page Logic (Read-Only)

Maintain a sorted list of top ESNC holders

Purely for display/bragging rights

No gating mint access based on leaderboard

### 🛡️ Anti-Sybil Measures

ESNC points are non-transferable

Referral is one-time + static (per sui address)

Wallet (sui address or user) cap: 5,000 ESNC points, more than that can not be given to a single player

Mint cap: 10 NFTs

### 📥 Reward System

Players/users can get ESNC points by completing activities

| Activity                                | ESNC Reward | Notes                     |
| --------------------------------------- | ----------- | ------------------------- |
| Signup, collect on the claim reward page| 50          | One-time                  |
| Daily Check-in (during Duelground slot) | 10          | Once per day              |
| Duel (win or lose)                      | 10          | Both players              |
| First duel vs a new sui address bonus   | +10         | One-time per pair         |
| Duel during Duelground gathering time   | +10         | Per duel                  |
| Referral Bind - Invitee                 | 30          | One-time                  |
| Referral Bind - Inviter                 | 20          | One-time                  |
| Duel by referred invitee (per duel)     | 2           | Passive reward to inviter |

Duelground gathering slots:
- 11:00-12:00 UTC 
- 20:00-21:00 UTC