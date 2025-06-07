import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StakeSelectorProps {
  selectedStake: number
  onStakeSelect: (stake: number) => void
  className?: string
}

// Allowed stake amounts in SUI (converted to MIST in the contract)
const ALLOWED_STAKES = [0, 1, 5, 10, 25, 50, 100]

/**
 * Component for selecting stake amount for duels
 */
export function StakeSelector({ selectedStake, onStakeSelect, className }: StakeSelectorProps) {
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
          {ALLOWED_STAKES.map((stake) => (
            <Button
              key={stake}
              variant={selectedStake === stake ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onStakeSelect(stake)}
              className="text-center"
            >
              {stake === 0 ? 'Free' : `${stake} Sui`}
            </Button>
          ))}
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
