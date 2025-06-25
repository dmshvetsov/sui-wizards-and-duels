import { timeInLocal } from "@/lib/rewards";

export function PrimeTimeMessage() {
  return (
    <div className="bg-black text-white px-4 py-2 text-center text-sm">
      Duelground gatherings, {timeInLocal[0].start}-{timeInLocal[0].end} and {timeInLocal[1].start}-
      {timeInLocal[1].end} ({Intl.DateTimeFormat().resolvedOptions().timeZone}){' '}
      prime-time matchmaking hours, always find players to duel with
      <br/>
      Check-in Daily during Duelground gatherings and get 10 Mint Essence
    </div>
  )
}
