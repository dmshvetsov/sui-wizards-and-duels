import { UserAccount } from '@/components/Authenticated'
import { Link } from '@/components/Link'
import { RealtimeChat } from '@/components/realtime-chat'
import { AppError } from '@/lib/error'
import type { Duel, DuelistCap, WithOnChainRef } from '@/lib/protocol/duel'
import { getPidLatest } from '@/lib/protocol/package'
import { getSpellSpec } from '@/lib/protocol/spell'
import { SFX } from '@/lib/sfx'
import { executeWith } from '@/lib/sui/client'
import { displayName } from '@/lib/user'
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { ForceBar } from './ForceBar'
import { WizardEffects } from './WizardEffects'

type ActionProps = {
  duel: WithOnChainRef<Duel>
  duelistCap: WithOnChainRef<DuelistCap>
  userAccount: UserAccount
}

export function Action(props: ActionProps) {
  const duel = props.duel
  const [duelistCap, setDuelistCap] = useState<WithOnChainRef<DuelistCap>>(props.duelistCap)
  const client = useSuiClient()
  const { mutate: signAndExecute, isPending: isSpellTxInProgress } = useSignAndExecuteTransaction({
    execute: executeWith(client, { showRawEffects: true, showObjectChanges: true }),
  })

  /**
   * @param opponentInput - opponent message during duel
   */
  const handleOpponentInput = useCallback(
    (opponentInput: string) => {
      const message = opponentInput.trim()
      if (!message) {
        return
      }
      const targetChar = message[0]
      const target =
        targetChar === '@' ? duelistCap?.wizard : targetChar === '!' ? duelistCap?.opponent : null
      if (!target) {
        // it is a chat message, do nothing
        return
      }

      const spellName = message.slice(1).trim().toLowerCase()
      const spellSpec = getSpellSpec(spellName)
      if (spellSpec) {
        console.debug('opponent spell', spellName)
        SFX.spellCast.play()
      }
    },
    [duelistCap]
  )

  /**
   * @param userInput- user message during duel
   * spell message format to apply to opponent: @ spellName
   * spell message format to apply to self: ! spellName
   * simple chat message starts with any other character than ! or @
   */
  const handleUserInput = useCallback(
    (userInput: string) => {
      const start = Date.now()

      const message = userInput.trim()
      if (!message) {
        return
      }
      if (!duel || !duelistCap) {
        toast.error('Something went wrong, refresh the page')
        new AppError('handleCastSpell', new Error('duel or duelistCap is null or undefiend')).log()
        return
      }

      const targetChar = message[0]
      const target =
        targetChar === '@' ? duelistCap.opponent : targetChar === '!' ? duelistCap.wizard : null
      if (!target) {
        // it is a chat message, do nothing
        return
      }

      const spellName = message.slice(1).trim().toLowerCase()
      const spellSpec = getSpellSpec(spellName)
      if (!spellSpec) {
        toast.warning(`${spellName} is not a spell`)
        return
      }

      SFX.spellCast.play()

      if (!duel || !duelistCap) {
        toast.error('Duel or DuelistCap is not available')
        return
      }

      const tx = new Transaction()
      tx.setGasBudget(2_000_000)
      // TODO: it is ok in devnet/testnet but must be fetched and memoized for mainnet
      tx.setGasPrice(1000)
      const duelInput = tx.sharedObjectRef({
        objectId: duel.id,
        mutable: true,
        initialSharedVersion: duel._version,
      })
      const duelistCapInput = tx.objectRef({
        objectId: duelistCap.id,
        version: duelistCap._version,
        digest: duelistCap._digest,
      })
      const [force] = tx.moveCall({
        target: `${getPidLatest()}::duel::use_force`,
        arguments: [duelInput, duelistCapInput, tx.pure.u64(spellSpec.cost)],
      })
      const [spell] = tx.moveCall({
        target: spellSpec.castMethod,
        arguments: [tx.object(force)],
      })
      tx.moveCall({
        target: spellSpec.applyMethod,
        arguments:
          spellSpec.module === 'damage'
            ? [tx.object(spell), duelInput, tx.pure.address(target)]
            : [duelInput, tx.object(spell), tx.pure.address(target)],
      })
      console.debug('cast spell tx', tx, duel.id, duelistCap.id, spellSpec)

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            SFX.spell.play(spellName)
            toast.success(`Cast spell ${message} successfully! (${Date.now() - start} ms)`)
            console.debug('Cast spell transaction result:', result)
          },
          onError: (err) => {
            const appErr = new AppError('handleCastSpell', err)
            toast.warning(`Failed to cast spell with ${appErr.message}`)
            appErr.log()
          },
          onSettled: (result) => {
            console.debug(
              `[performance] | ${message} spell transaction settled in ${Date.now() - start} ms`
            )

            if (result?.objectChanges) {
              result.objectChanges.forEach((obj) => {
                if (obj.type === 'mutated' && obj.objectId === duelistCap.id) {
                  setDuelistCap((prev) => ({
                    ...prev!,
                    _version: obj.version,
                    _digest: obj.digest,
                  }))
                }
              })
            }
          },
        }
      )
    },
    [duel, duelistCap, signAndExecute]
  )

  if (!duel || !duelistCap) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
        <p className="text-lg font-semibold text-gray-700">Duel not found</p>
        <Link className="mt-4" to="/d">
          Back to Duelground
        </Link>
      </div>
    )
  }

  // Get opponent ID
  const opponentId = duelistCap?.opponent || ''
  const wizardEffects =
    props.userAccount.id === duel.wizard1 ? duel.wizard1_effects : duel.wizard2_effects
  const opponentEffects =
    props.userAccount.id === duel.wizard1 ? duel.wizard2_effects : duel.wizard1_effects

  return (
    <>
      <RealtimeChat
        roomName={props.duel.id}
        username={props.userAccount.displayName}
        onMessage={handleUserInput}
        disabled={isSpellTxInProgress}
        onIncomingMessage={handleOpponentInput}
      />
      <div className="flex flex-col w-full">
        {duel !== null && props.userAccount && (
          <>
            <ForceBar duel={duel} currentWizardId={props.userAccount.id} />

            <div className="flex justify-between items-start py-8 px-4 w-full">
              <div className="flex flex-col items-center w-1/3">
                <div className="w-12 h-12 bg-orange-300 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl">🧙</span>
                </div>
                <p className="font-semibold text-sm">{displayName(opponentId)}</p>
                <div className="mt-2 min-h-[30px]">
                  <WizardEffects effects={opponentEffects} />
                </div>
              </div>

              <div className="text-lg font-bold flex items-center">VS</div>

              <div className="flex flex-col items-center w-1/3">
                <div className="w-12 h-12 bg-indigo-300 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl">🧙‍♂️</span>
                </div>
                <p className="font-semibold text-sm">you</p>
                <div className="mt-2 min-h-[30px]">
                  <WizardEffects effects={wizardEffects} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
