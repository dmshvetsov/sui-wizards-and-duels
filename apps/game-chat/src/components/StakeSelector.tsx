import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { type Waitroom } from '@/lib/protocol/waitroom'
import type { UserAccount } from '@/components/Authenticated'

interface StakeSelectorProps {
  selectedStake: number
  onStakeSelect: (stake: number) => void
  className?: string
  queue?: Waitroom['queue']
  userAccount?: UserAccount
}

// Allowed stake amounts in SUI (converted to MIST in the contract)
const ALLOWED_STAKES: number[] = [0, 1, 5, 10, 25, 50, 100]

/**
 * Component for selecting stake amount for duels
 */
export function StakeSelector({ 
  selectedStake, 
  onStakeSelect, 
  className, 
  queue = [], 
  userAccount 
}: StakeSelectorProps) {
  return (
    <Card className={cn('w-[300px] h-[370px] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-580', className)}>
      <CardHeader>
        <CardTitle><h3>Select Stake Amount</h3></CardTitle>
        <CardDescription>
          Choose how much SUI you want to stake for this duel. Winner takes all!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {ALLOWED_STAKES.map((stake) => {
            // Check if this stake is in the queue
            const stakeInQueue = queue.find(pair => 
              BigInt(pair.fields.stake_amount) === BigInt(stake * 1_000_000_000)
            )
            
            // Determine button style based on queue status
            const isOpenToPlay = stakeInQueue?.fields.wizard2 === '0x0000000000000000000000000000000000000000000000000000000000000000'
            const isUsersInvitation = stakeInQueue?.fields.wizard2 === userAccount?.id
            
            return (
              <Button
                key={stake}
                variant={selectedStake === stake ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onStakeSelect(stake)}
                className={cn("text-center transition-all", {
                  'border-indigo-100 hover:bg-indigo-100 drop-shadow-sm drop-shadow-indigo-500/50': isOpenToPlay,
                  'border-orange-100 hover:bg-orange-100 drop-shadow-sm drop-shadow-orange-500/50': isUsersInvitation,
                  'bg-indigo-500 hover:bg-indigo-600 text-white hover:text-white': selectedStake === stake && isOpenToPlay,
                  'bg-orange-500 hover:bg-orange-600 text-white hover:text-white': selectedStake === stake && isUsersInvitation,
                })}
              >
                {stake === 0 ? 'Free' : `${stake} Sui`}
              </Button>
            )
          })}
        </div>
        <div className="px-5 py-4 bg-muted rounded-md mt-8 h-[80px]">
          <p className="text-sm text-muted-foreground">
            {selectedStake > 0
              ? `Your next duel stake will be ${selectedStake} Sui. If you win, you get ${selectedStake * 2} Sui.`
              : 'No Sui at stake, duel for fun, only pay for transactions gas!'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
