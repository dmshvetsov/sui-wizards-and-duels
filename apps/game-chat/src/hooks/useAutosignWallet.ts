import { Transaction } from '@mysten/sui/transactions'
import { PublicKey } from '@mysten/sui/cryptography'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { MultiSigPublicKey } from '@mysten/sui/multisig'
import { useCallback, useMemo } from 'react'
import { useSuiClient } from '@mysten/dapp-kit'
import { SuiTransactionBlockResponse } from '@mysten/sui/client'

// FIXME: must use either backend or safe KP storage or derive KP from a user input
const APK = import.meta.env.VITE_WIZARDS_AND_DUELS_AUTOSIGNER_PRIVATE_KEY
if (!APK) {
  throw new Error('Configuration error APK is not defined')
}

export function useAutosignWallet(userWalllet: PublicKey) {
  const client = useSuiClient()
  const autoSignerKeyPair = Ed25519Keypair.fromSecretKey(new Uint8Array(JSON.parse(APK)), {
    skipValidation: true,
  })

  const multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
    threshold: 1,
    publicKeys: [
      {
        publicKey: autoSignerKeyPair.getPublicKey(),
        weight: 1,
      },
      {
        publicKey: userWalllet,
        weight: 1,
      },
    ],
  })

  const signer = multiSigPublicKey.getSigner(autoSignerKeyPair)

  const signAndExecute = useCallback(
    (
      params: { transaction: Transaction },
      opts: {
        onSuccess?: (result: SuiTransactionBlockResponse) => void
        onError?: (error: unknown,) => void
        onSettled?: (result: SuiTransactionBlockResponse | undefined, error: unknown | undefined) => void
      } = {}
    ) => {
      client
        .signAndExecuteTransaction({
          transaction: params.transaction,
          signer,
        })
        .then((res) => {
          if (typeof opts.onSuccess === 'function') {
            opts.onSuccess(res)
          }
          if (typeof opts.onSettled === 'function') {
            opts.onSettled(res, undefined)
          }
        }).catch(err => {
          if (typeof opts.onError === 'function') {
            opts.onError(err)
          }
          if (typeof opts.onSettled === 'function') {
            opts.onSettled(undefined, err)
          }
        })
    },
    [signer, client]
  )

  const address = multiSigPublicKey.toSuiAddress()
  return useMemo(
    () => ({
      signAndExecute,
      address,
    }),
    [address, signAndExecute]
  )
}
