import { createDefaultEncryption } from '@mysten/enoki'
import { getClient } from './supabase/client'
import { createOrUpdateUserAccount } from './supabase/users'
import { AppError } from './error'
import {} from '@mysten/dapp-kit'

const ENOKI_API_KEY = import.meta.env.VITE_ENOKI_API_KEY ?? ''
if (!ENOKI_API_KEY) {
  throw new Error('missing configuration for ZKLogin')
}

export async function logIn(address: string, network: string) {
  const enc = createDefaultEncryption()
  const val = sessionStorage.getItem(`@enoki/flow/session/${ENOKI_API_KEY}/${network}`) ?? ''
  if (!val) {
    throw new Error('zklogin token not found')
  }

  try {
    const decryptedRes = await enc.decrypt(ENOKI_API_KEY, val)
    if (!decryptedRes) {
      throw new Error('failed to read zklogin token')
    }

    const session = JSON.parse(decryptedRes) as { jwt?: string }
    if (!session.jwt) {
      throw new Error('current session missing token')
    }

    try {
      const authRes = await getClient().auth.signInWithIdToken({
        provider: 'google',
        token: session.jwt,
      })
      if (authRes.error) {
        throw authRes.error
      }

      // do not await
      createOrUpdateUserAccount(address)
        .then(() => {
          console.debug('account initialized')
        })
        .catch((err) => {
          new AppError('logIn createOrUpdateUserAccount', err).log()
        })

      return authRes.data
    } catch (err) {
      new AppError('logIn signInWithIdToken', err).log()
      throw err
    }
  } catch (err) {
    new AppError('logIn token decrypt', err).log()
    throw err
  }
}
