import { UserAccount } from '@/components/Authenticated'
import { Link } from '@/components/Link'
import { Loader } from '@/components/Loader'
import { RealtimeChat } from '@/components/realtime-chat'
import { useDuel } from '@/context/DuelContext'
import { AppError } from '@/lib/error'
import { getPidLatest } from '@/lib/protocol/package'
import { getSpellSpec } from '@/lib/protocol/spell'
import { SFX } from '@/lib/sfx'
import { executeWith } from '@/lib/sui/client'
import { displayName } from '@/lib/user'
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { ForceBar } from './ForceBar'
import { WizardEffects } from './WizardEffects'

export function Action(props: { duelId: string; userAccount: UserAccount }) {
  const { duel, duelistCap, isLoading } = useDuel()
  const client = useSuiClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
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
        // it is a chat message, do nothig
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
        // it is a chat message, do nothig
        return
      }

      const spellName = message.slice(1).trim().toLowerCase()
      const spellSpec = getSpellSpec(spellName)
      if (!spellSpec) {
        toast.warning(`${spellName} is not a spell`)
        return
      }

      SFX.spellCast.play()

      const tx = new Transaction()
      const [force] = tx.moveCall({
        target: `${getPidLatest()}::duel::use_force`,
        arguments: [tx.object(duel.id), tx.object(duelistCap.id), tx.pure.u64(spellSpec.cost)],
      })
      const [spell] = tx.moveCall({
        target: spellSpec.castMethod,
        arguments: [tx.object(force)],
      })
      tx.moveCall({
        target: spellSpec.applyMethod,
        arguments:
          spellSpec.module === 'damage'
            ? [tx.object(spell), tx.object(duel.id), tx.pure.address(target)]
            : [tx.object(duel.id), tx.object(spell), tx.pure.address(target)],
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
          onSettled: () => {
            console.debug(
              `[performance] | ${message} spell transaction settled in ${Date.now() - start} ms`
            )
          },
        }
      )
    },
    [duel, duelistCap, signAndExecute]
  )

  if (isLoading) {
    return <Loader />
  }
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
        roomName={props.duelId}
        username={props.userAccount.displayName}
        onMessage={handleUserInput}
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
