import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

interface WizardEffectsProps {
  effects: [number, number, number]
}

/**
 * Component to display wizard effects (choke, throw, deflect)
 *
 * @param duel - The duel object containing wizard effects
 * @param wizardId - The ID of the wizard whose effects to display
 */
export function WizardEffects({ effects }: WizardEffectsProps) {

  const chokeEffect = effects[0] ?? 0
  const throwEffect = effects[1] ?? 0
  const deflectEffect = effects[2] ?? 0

  const [showChokeTooltip, setShowChokeTooltip] = useState(false)
  const [showThrowTooltip, setShowThrowTooltip] = useState(false)
  const [showDeflectTooltip, setShowDeflectTooltip] = useState(false)

  return (
    <div className="flex items-center gap-2">
      {chokeEffect > 0 && (
        <div className="relative">
          <Badge
            className="flex bg-gray-700 items-center gap-1 cursor-help text-white"
            onMouseEnter={() => setShowChokeTooltip(true)}
            onMouseLeave={() => setShowChokeTooltip(false)}
          >
            <span>choke</span><span>{Math.min(3, chokeEffect)} / 3</span>
          </Badge>

          {showChokeTooltip && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-800 text-white text-xs rounded shadow-lg w-48 z-10">
              <p>Prevents deflect. If choke level reaches 3, force is reduced to 0.</p>
              <p className="mt-1 font-semibold">Current level: {chokeEffect}/3</p>
              <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
            </div>
          )}
        </div>
      )}

      {throwEffect > 0 && (
        <div className="relative">
          <Badge
            variant="secondary"
            className="bg-blue-500 hover:bg-blue-600 text-white cursor-help"
            onMouseEnter={() => setShowThrowTooltip(true)}
            onMouseLeave={() => setShowThrowTooltip(false)}
          >
            thrown
          </Badge>

          {showThrowTooltip && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-800 text-white text-xs rounded shadow-lg w-48 z-10">
              <p>Removes choke effect from the target.</p>
              <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
            </div>
          )}
        </div>
      )}

      {deflectEffect > 0 && (
        <div className="relative">
          <Badge
            variant="outline"
            className="border-indigo-500 text-indigo-600 cursor-help"
            onMouseEnter={() => setShowDeflectTooltip(true)}
            onMouseLeave={() => setShowDeflectTooltip(false)}
          >
            deflect
          </Badge>

          {showDeflectTooltip && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-800 text-white text-xs rounded shadow-lg w-48 z-10">
              <p>Nullifies the next damage spell and is consumed when used.</p>
              <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
