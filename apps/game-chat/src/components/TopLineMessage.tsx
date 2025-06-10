const formatTime = (hours: number) => {
  return new Date(Date.UTC(2000, 0, 1, hours)).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: 'numeric',
  })
}

export function PrimeTimeMessage() {
  const timeInUtc = [
    { start: 5, end: 6 },
    { start: 11, end: 12 },
  ].map(({ start, end }) => ({
    start: formatTime(start),
    end: formatTime(end),
  }))

  return (
    <div className="bg-black text-white px-4 py-2 text-center text-sm">
      Duelground gatherings, {timeInUtc[0].start}-{timeInUtc[0].end} and {timeInUtc[1].start}-
      {timeInUtc[1].end} ({Intl.DateTimeFormat().resolvedOptions().timeZone}){' '}
      prime-time matchmaking hours, always find players to duel with
    </div>
  )
}
