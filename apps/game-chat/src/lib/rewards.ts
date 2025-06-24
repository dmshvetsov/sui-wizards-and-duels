const formatTime = (hours: number) => {
  return new Date(Date.UTC(2000, 0, 1, hours)).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: 'numeric',
  })
}

export const timeInUtc = [
    { start: 11, end: 12 },
    { start: 20, end: 21 },
  ]

export const timeInLocal = timeInUtc.map(({ start, end }) => ({
  start: formatTime(start),
  end: formatTime(end),
}))
