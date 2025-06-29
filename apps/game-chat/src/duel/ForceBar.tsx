import { Duel } from "@/lib/protocol/duel";

export function ForceBar({ duel, currentWizardId }: { duel: Duel; currentWizardId: string }) {
  const forceRatio =
    currentWizardId === duel.wizard1
      ? (duel.wizard2_force / (duel.wizard2_force + duel.wizard1_force)) * 100
      : (duel.wizard1_force / (duel.wizard2_force + duel.wizard1_force)) * 100
  const currentWizardForce =
    currentWizardId === duel.wizard1 ? duel.wizard1_force : duel.wizard2_force
  const opponentForce = currentWizardId === duel.wizard1 ? duel.wizard2_force : duel.wizard1_force
  return (
    <div className="w-full bg-white flex justify-between gap-2 items-center">
      <div className="w-24 text-left text-4xl font-bold">{opponentForce}</div>
      <div className="w-full bg-gradient-to-r from-indigo-500 to-indigo-800 h-2 rounded-xs">
        <div
          className="bg-gradient-to-r from-gray-500 to-gray-400 h-2 rounded-xs"
          style={{
            width: `${forceRatio}%`,
            transition: 'width 0.5s ease-in-out',
          }}
        />
      </div>
      <div className="w-24 text-right text-4xl font-bold">{currentWizardForce}</div>
    </div>
  )
}
