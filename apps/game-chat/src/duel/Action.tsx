import { UserAccount } from '@/components/Authenticated'
import { RealtimeChat } from '@/components/realtime-chat'
import { Button } from '@/components/ui/button'
import { useDuel } from '@/context/DuelContext'
import { useAutosignWallet } from '@/hooks/useAutosignWallet'
import { AppError } from '@/lib/error'
import { Duel } from '@/lib/protocol/duel'
import { getPidLatest } from '@/lib/protocol/package'
import { Transaction } from '@mysten/sui/transactions'
import { useCallback } from 'react'
import { toast } from 'sonner'

export function Action(props: { duelId: string; userAccount: UserAccount }) {
  const { duel, duelistCap, spells, refetchSpells } = useDuel()
  const autoSignWallet = useAutosignWallet(props.userAccount.publicKey)

  const handleSetupWizard = useCallback(() => {
    if (!duel) {
      toast.error('Duel data not available')
      return
    }

    const tx = new Transaction()
    tx.moveCall({
      target: `${getPidLatest()}::duel::setup_wizard`,
      arguments: [],
    })

    autoSignWallet.signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          toast.success(`Setup wizard successfully!`)
          console.log('Setup wizard transaction result:', result)
        },
        onError: (err) => {
          const appErr = new AppError('handleSetupWizard', err);
          toast.error(`Failed to setup wizard with ${appErr.message}`)
          appErr.log()
        },
        onSettled: () => {
          refetchSpells()
        },
      }
    )
  }, [duel, autoSignWallet, refetchSpells])

  const handleCastSpell = useCallback(
    (message: string) => {
      // Check if message is a command to cast a spell
      if (!message || !message.trim()) {
        return
      }
      if (message.toLowerCase()) {
        const spellName = message

        if (!duel || !duelistCap) {
          // TODO: better error message
          toast.error('Duel data not available')
          return
        }

        if (!spells || !spells.length) {
          toast.error('No spells available')
          return
        }

        // Create transaction to cast spell
        const tx = new Transaction()
        tx.moveCall({
          target: `${getPidLatest()}::duel::cast_spell`,
          arguments: [
            tx.object(duel.id), // duel object
            tx.object(duelistCap.id), // TODO: should use id, digest and version?
            tx.object(spells[0].id), // TODO: Replace with actual Spell object ID
          ],
        })
        console.debug('cast spell tx', tx, duel.id, duelistCap.id, spells[0].id)

        autoSignWallet.signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: (result) => {
              toast.success(`Cast spell ${spellName} successfully!`)
              console.log('Cast spell transaction result:', result)
            },
            onError: (err) => {
              const appErr = new AppError('handleCastSpell', err);
              toast.warning(`Failed to cast spell with ${appErr.message}`)
              appErr.log()
            },
          }
        )
      }
    },
    [duel, autoSignWallet, duelistCap, spells]
  )

  if (spells && !spells.length) {
    return <Button onClick={handleSetupWizard}>Prepare spells</Button>
  }

  return (
    <>
      <div>
        <p className="text-sm text-gray-600 mt-2">you: {props.userAccount.displayName}</p>
        <p className="text-sm text-gray-600 mt-2">wizard address: {autoSignWallet.address}</p>
      </div>
      {duel !== null && props.userAccount && <div className='absolute top-0'><ForceBar duel={duel} currentWizard={props.userAccount.username} /></div>}
      <RealtimeChat roomName={props.duelId} username={props.userAccount.username} onMessage={handleCastSpell} />
    </>
  )
}

function ForceBar({ duel, currentWizard }: { duel: Duel; currentWizard: string }) {
  const forceRatio =
    currentWizard === duel.wizard1
      ? (duel.wizard2_force / (duel.wizard2_force + duel.wizard1_force)) * 100
      : (duel.wizard1_force / (duel.wizard2_force + duel.wizard1_force)) * 100
  const currentWizardForce =
    currentWizard === duel.wizard1 ? duel.wizard1_force : duel.wizard2_force
  const opponentForce = currentWizard === duel.wizard1 ? duel.wizard2_force : duel.wizard1_force
  return (
    <div className="w-[400px] bg-white flex justify-between items-center gap-2 items-center py-4">
      <div className="w-8">{opponentForce}</div>
      <div className="w-full bg-blue-500 h-2 rounded-full">
        <div
          className="bg-gray-200 h-2"
          style={{
            width: `${forceRatio}%`,
            transition: 'width 0.5s ease-in-out',
          }}
        />
      </div>
      <div className="w-8">{currentWizardForce}</div>
    </div>
  )
}
