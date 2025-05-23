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
    <div className="w-full bg-white flex justify-between items-center gap-2 items-center px-4">
      <div className="w-8">{opponentForce}</div>
      <div className="w-full bg-linear-to-r from-indigo-500 to-indigo-700 h-2 rounded-md">
        <div
          className="bg-linear-to-r from-orange-700 to-orange-500 h-2 rounded-md"
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
