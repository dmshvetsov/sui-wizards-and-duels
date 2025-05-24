import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StakeSelectorProps {
  selectedStake: number
  onStakeSelect: (stake: number) => void
  className?: string
}

// Allowed stake amounts in SUI (converted to MIST in the contract)
export const ALLOWED_STAKES = [0, 1, 5, 10, 25, 50, 100]

/**
 * Component for selecting stake amount for duels
 */
export function StakeSelector({ selectedStake, onStakeSelect, className }: StakeSelectorProps) {
  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle>Select Stake Amount</CardTitle>
        <CardDescription>
          Choose how much SUI you want to stake for this duel. Winner takes all!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {ALLOWED_STAKES.map((stake) => (
            <Button
              key={stake}
              variant={selectedStake === stake ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStakeSelect(stake)}
              className="text-center"
            >
              {stake === 0 ? 'Free' : `${stake} SUI`}
            </Button>
          ))}
        </div>
        {selectedStake > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Selected:</strong> {selectedStake} SUI
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You will stake {selectedStake} SUI. If you win, you get {selectedStake * 2} SUI total.
            </p>
          </div>
        )}
        {selectedStake === 0 && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Free duel</strong> - No SUI at stake, just for fun!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Convert MIST amount to SUI for display
 */
export function mistToSui(mist: string | number): number {
  const mistNum = typeof mist === 'string' ? parseInt(mist) : mist
  return mistNum / 1_000_000_000
}
