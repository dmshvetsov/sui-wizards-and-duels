import { UserAccount } from '@/components/Authenticated'
import { RealtimeChat } from '@/components/realtime-chat'
import { useDuel } from '@/context/DuelContext'
import { AppError } from '@/lib/error'
import { getPidLatest } from '@/lib/protocol/package'
import { getSpellName, spell } from '@/lib/spell'
import { executeWith } from '@/lib/sui/client'
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { ForceBar } from './ForceBar'

export function Action(props: { duelId: string; userAccount: UserAccount }) {
  const { duel, duelistCap } = useDuel()
  const client = useSuiClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: executeWith(client, { showRawEffects: true, showObjectChanges: true }),
  })

  const handleCastSpell = useCallback(
    (message: string) => {
      const start = Date.now()
      // Check if message is a command to cast a spell
      if (!message || !message.trim()) {
        return
      }
      const spellName = getSpellName(message)
      if (!spellName) {
        toast.warning(`${message} is not a spell`)
        return
      }

      if (!duel || !duelistCap) {
        toast.error('Something went wrong, refresh the page')
        new AppError('handleCastSpell', new Error('duel or duelistCap is null or undefiend')).log()
        return
      }

      // Create transaction to cast spell
      const tx = new Transaction()
      const [force] = tx.moveCall({
        target: `${getPidLatest()}::duel::use_force`,
        arguments: [
          tx.object(duel.id),
          tx.object(duelistCap.id),
          tx.pure.u64(spell.cost[spellName]),
        ],
      })
      const [damage] = tx.moveCall({
        target: `${getPidLatest()}::spell::cast_${spellName}`,
        arguments: [tx.object(force)],
      })
      tx.moveCall({
        target: `${getPidLatest()}::damage::apply`,
        arguments: [tx.object(damage), tx.object(duel.id), tx.pure.address(duelistCap.opponent)],
      })
      console.debug('cast spell tx', tx, duel.id, duelistCap.id, spellName)

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            toast.success(`Cast spell ${spellName} successfully!`)
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

  return (
    <>
      <div>
        <p className="text-sm text-gray-600 mt-2">you: {props.userAccount.displayName}</p>
        <p className="text-sm text-gray-600 mt-2">wizard address: {props.userAccount.id}</p>
      </div>
      {duel !== null && props.userAccount && (
        <div className="absolute top-0">
          <ForceBar duel={duel} currentWizardId={props.userAccount.id} />
        </div>
      )}
      <RealtimeChat
        roomName={props.duelId}
        username={props.userAccount.username}
        onMessage={handleCastSpell}
      />
    </>
  )
}
