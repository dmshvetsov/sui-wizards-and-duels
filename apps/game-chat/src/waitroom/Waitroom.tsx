import { AuthenticatedComponentProps } from '@/components/Authenticated'
import { Loader } from '@/components/Loader'
import { Button } from '@/components/ui/button'
import { useAutosignWallet } from '@/hooks/useAutosignWallet'
import { DUEL, DuelistCap } from '@/lib/protocol/duel'
import { joinTx, leaveTx, Waitroom, waitroom } from '@/lib/protocol/waitroom'
import { createRoom } from '@/lib/supabase/client'
import { displayName } from '@/lib/user'
import { useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const UNCONNECTED_COUNTER_STATE = 0

const ONE_SECOND_IN_MS = 1000

type WaitState = 'loading' | 'iddle' | 'needs_funding' | 'waiting' | 'paired'

export function WaitRoom({ userAccount }: AuthenticatedComponentProps) {
  const [onlineCount, setOnlineCount] = useState(UNCONNECTED_COUNTER_STATE)
  const [waitState, setWaitState] = useState<WaitState>('loading')
  const [isFunding, setIsFunding] = useState(false)
  const autoSignWallet = useAutosignWallet(userAccount.publicKey)
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()

  const navigate = useNavigate()

  const waitroomQuery = useSuiClientQuery(
    'getObject',
    {
      id: waitroom.object.waitroom,
      options: { showContent: true },
    },
    { enabled: waitState !== 'loading', refetchInterval: ONE_SECOND_IN_MS }
  )
  const duelistCapQuery = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: autoSignWallet.address,
      filter: {
        StructType: DUEL.type.duelCap,
      },
      options: { showContent: true },
    },
    { refetchInterval: ONE_SECOND_IN_MS }
  )

  // Query to check the balance of the wizard wallet
  const autoSignWalletBalanceQuery = useSuiClientQuery(
    'getBalance',
    {
      owner: autoSignWallet.address,
      coinType: '0x2::sui::SUI',
    },
    { refetchInterval: ONE_SECOND_IN_MS }
  )

  useEffect(() => {
    const channel = createRoom('waitroom', { config: { presence: { key: userAccount.id } } })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        console.debug('sync state', state)
        setOnlineCount(new Set(Object.keys(state)).size)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.debug('join', key, newPresences)
        toast(`${displayName(key)} joined the Duelground`)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.debug('leave', key, leftPresences)
        toast(`${displayName(key)} left the Duelground`)
      })

    channel.subscribe((status, err?: Error) => {
      if (status === 'SUBSCRIBED') {
        channel.track({
          user_id: userAccount.id,
          joined_at: Date.now(),
        })
      }
      if (err) {
        console.error('WaitRoom channel error:', err)
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [userAccount.id, navigate])

  useEffect(() => {
    if (!duelistCapQuery.data) {
      return
    }
    // assume players will only have 1 duelistCap
    // but take the last one which should be the most recent in case if a player holds multiple DuelistCaps
    const duelistCap = duelistCapQuery.data.data?.at(-1)?.data
    if (!duelistCap || duelistCap.content?.dataType !== 'moveObject') {
      console.debug('no existing duelist cap found')
      setWaitState('iddle')
      return
    }

    console.debug('found existing duelist cap', duelistCap)
    const duelId = (duelistCap.content?.fields as DuelistCap).duel
    navigate(`/d/${duelId}`)
  }, [duelistCapQuery.data, navigate])

  useEffect(() => {
    // Check if the wallet has enough SUI
    if (!autoSignWalletBalanceQuery.data) {
      return
    }

    const balanceInMist = BigInt(autoSignWalletBalanceQuery.data.totalBalance)
    const requiredBalanceInMist = 12800000n // 0.0128 SUI in MIST

    console.debug('Wizard wallet balance:', balanceInMist.toString(), 'MIST')

    // If the wallet doesn't have enough SUI, set the state to needs_funding
    if (balanceInMist < requiredBalanceInMist && waitState === 'iddle') {
      setWaitState('needs_funding')
    }
  }, [autoSignWalletBalanceQuery.data, waitState])

  const waitroomState = waitroomQuery.data?.data;
  useEffect(() => {
    if (!waitroomState) {
      return
    }
    if (waitroomState.content?.dataType !== 'moveObject') {
      console.warn('failed to load Waitroom state')
      return
    }

    console.debug('waitroom data', waitroomState)
    const queue = (waitroomState.content.fields as Waitroom).queue
    const isInQueue = queue.find((pair) => pair.fields.wizard1 === autoSignWallet.address) != null
    if (isInQueue) {
      setWaitState('waiting')
    } else {
      // Only set to idle if not in needs_funding state
      if (waitState !== 'needs_funding') {
        setWaitState('iddle')
      }
    }
  }, [waitroomState, autoSignWallet.address, waitState])

  const handleJoinWaitlist = useCallback(() => {
    autoSignWallet.signAndExecute(
      { transaction: joinTx() },
      {
        onSuccess(_result) {
          console.debug('waitroom join tx success', _result)
        },
      }
    )
  }, [autoSignWallet])

  const handleLeave = useCallback(() => {
    autoSignWallet.signAndExecute(
      { transaction: leaveTx() },
      {
        onSuccess(_result) {
          console.debug('waitroom leave tx success', _result)
        },
      }
    )
  }, [autoSignWallet])

  // Function to fund the wizard wallet with 0.0128 SUI
  const handleFundWallet = useCallback(() => {
    setIsFunding(true)

    // Create a transaction to transfer 0.0128 SUI to the wizard wallet
    const tx = new Transaction()
    // Convert 0.0128 SUI to MIST (1 SUI = 10^9 MIST)
    const amountInMist = 12800000 // 0.0128 SUI in MIST

    // Split coins from the gas object and transfer to the wizard wallet
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)])
    tx.transferObjects([coin], tx.pure.address(autoSignWallet.address))

    // Set gas budget and execute the transaction
    tx.setGasBudget(3_500_000)

    // Use the dapp-kit hook to sign and execute the transaction
    signAndExecuteTransaction(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.debug('Fund wizard wallet transaction success:', result)
          toast.success('Successfully funded wizard wallet with 0.0128 SUI!')
          setWaitState('iddle') // Change to idle state to show the Play button
          autoSignWalletBalanceQuery.refetch() // Refresh the balance
        },
        onError: (error) => {
          console.error('Fund wizard wallet transaction error:', error)
          toast.error('Failed to fund wizard wallet. Please try again.')
        },
        onSettled: () => {
          setIsFunding(false)
        }
      }
    )
  }, [autoSignWallet.address, signAndExecuteTransaction, autoSignWalletBalanceQuery, setWaitState, setIsFunding])

  if (onlineCount === UNCONNECTED_COUNTER_STATE || waitState === 'loading') {
    return <Loader />
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-semibold mb-2">Duelground</h1>
      <p className="text-lg">
        wizards online:{' '}
        <span className="font-bold">{onlineCount === 1 ? 'only you' : onlineCount}</span>
      </p>

      {waitState === 'paired' ? (
        <p className="mt-4">
          <span className="animate-pulse font-semibold text-green-600">
            OPPONENT FOUND! PREPARE FOR A DUEL...
          </span>
        </p>
      ) : waitState === 'waiting' ? (
        <>
          <p className="mt-4">
            <span className="animate-pulse font-semibold">FINDING OPPONENT</span>
          </p>
          <Button className="mt-4" onClick={handleLeave}>
            Cancel
          </Button>
        </>
      ) : waitState === 'needs_funding' ? (
        <>
          <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <h2 className="text-lg font-semibold text-yellow-800">Fund Wizard Wallet</h2>
            <p className="mt-2 text-yellow-700">
              Send Sui force to your wizard wallet to participate in duels.
            </p>
          </div>
          <Button
            className="mt-4 bg-yellow-500 hover:bg-yellow-600"
            onClick={handleFundWallet}
            disabled={isFunding}
          >
            {isFunding ? 'Funding...' : 'Fund Wizard Wallet'}
          </Button>
          <p className="mt-2 text-sm text-gray-600">
            This will transfer 0.0128 SUI from your wallet to the wizard wallet.
          </p>
        </>
      ) : onlineCount > 1 ? (
        <>
          <Button className="mt-4" onClick={handleJoinWaitlist}>
            Play
          </Button>
          <p className="mt-2">Join other player in Wizards Duels.</p>
          <p>Defeat your opponent to take away his Sui force.</p>
        </>
      ) : (
        <p>
          Give it time for other Wizards to join or invite friends with the following link{' '}
          <span className="font-semibold">{window.location.toString()}</span>
        </p>
      )}
      <div className='absolute top-0 py-4'>
        <p className="text-sm text-gray-600 mt-2">you: {userAccount.displayName}</p>
        <p className="text-sm text-gray-600 mt-2">wizard address: {autoSignWallet.address}</p>
      </div>
    </div>
  )
}
