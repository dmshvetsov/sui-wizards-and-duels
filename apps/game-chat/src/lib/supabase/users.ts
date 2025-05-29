import { displayName as displayNameFromAddress } from '../user'
import { getClient, NOT_FOUND_ERR_CODE } from './client'

/**
 * Link between users relation and accounts
 */
export type UserAccountsRelation = {
  sui_address: string
  user_id: string
  display_name: string
  created_at?: string
  updated_at?: string
}

const USER_ACCOUNT_TABLE = 'user_accounts'

/**
 * Create or update a link between a wallet address and app auth user record
*
 * @param suiAddress The Sui wallet address from Enoki
 * @param displayName The display name for the user
 * @returns The created or updated user metadata
 */
export async function createOrUpdateUserAccount(
  suiAddress: string,
): Promise<UserAccountsRelation> {
  // First, check if a user with this sui_address already exists
  const { data: existingUserAccount, error: existingfetchError } = await getClient()
    .from(USER_ACCOUNT_TABLE)
    .select('*')
    .eq('sui_address', suiAddress)
    .single<UserAccountsRelation>()

  if (existingfetchError && existingfetchError.code !== NOT_FOUND_ERR_CODE) {
    // PGRST116 is the error code for "no rows returned"
    throw existingfetchError
  }

  const displayName = displayNameFromAddress(suiAddress)
  if (existingUserAccount && existingUserAccount.display_name === displayName) {
    return existingUserAccount
  } else if (existingUserAccount) {
    // Update the existing user
    const { data, error } = await getClient()
      .from(USER_ACCOUNT_TABLE)
      .update({ display_name: displayName })
      .eq('sui_address', suiAddress)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as UserAccountsRelation
  } else {
    // Create a new user
    const { data, error } = await getClient()
      .from(USER_ACCOUNT_TABLE)
      .insert({
        sui_address: suiAddress,
        display_name: displayName,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as UserAccountsRelation
  }
}

/**
 * Get a user account relation by their Sui address
*
 * @param suiAddress The Sui wallet address
 * @returns The user metadata or null if not found
 */
export async function getUserAccount(suiAddress: string): Promise<UserAccountsRelation | null> {
  const { data, error } = await getClient()
    .from(USER_ACCOUNT_TABLE)
    .select('*')
    .eq('sui_address', suiAddress)
    .single()

  if (error) {
    if (error.code === NOT_FOUND_ERR_CODE) {
      // No user found
      console.error('Error fetching user: not found')
      return null
    }
    throw error
  }

  return data as UserAccountsRelation
}
