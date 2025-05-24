import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SpellButtonsProps {
  onCastSpell: (spell: string) => void
  className?: string
}

const SPELLS = [
  {
    name: '@arrow',
    label: '@arrow',
    description: 'Cast arrow spell on opponent. Cost: 4, Damage: 12',
  },
  {
    name: '@choke',
    label: '@choke',
    description:
      'Cast choke spell on opponent.  Cost: 5, Effect: Choke, Stack 3x Choke to immediately defeat opponent, removes Deflect effect from opponent',
  },
  {
    name: '@throw',
    label: '@throw',
    description:
      'Cast throw spell on opponent. Cost: 2, Effect: Throw, removes Choke effect casted by opponent, removs opponent Deflect effect',
  },
  {
    name: '!deflect',
    label: '!deflect',
    description:
      'Cast deflect spell on yourself. Cost: 3, Effect: Deflect, Deflects next spell casted by opponent, you will get no damage, half of damage will be returned to opponent',
  },
]

/**
 * SpellButtons component displays buttons for casting spells
 * @param onCastSpell - Callback function when a spell button is clicked
 * @param className - Additional CSS classes
 */
export function SpellButtons({ onCastSpell, className }: SpellButtonsProps) {
  return (
    <div className={cn('flex flex-col justify-center gap-2 p-2', className)}>
      <h3>Spell book</h3>
      {SPELLS.map((spell) => (
        <Button
          key={spell.name}
          size="sm"
          variant="ghost"
          className="w-fit italic"
          title={spell.description}
          onClick={() => onCastSpell(spell.name)}
        >
          {spell.label}
        </Button>
      ))}
    </div>
  )
}
