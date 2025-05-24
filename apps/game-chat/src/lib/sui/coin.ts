const MIST_PER_SUI = BigInt(1e9)

export function formatMistBalance(balanceMist: string): string {
  if (!balanceMist) {
    return ''
  }

  const mist = BigInt(balanceMist)
  if (mist <= MIST_PER_SUI) {
    return (Number(balanceMist) / Number(MIST_PER_SUI)).toString().slice(0, 4)
  }

  const suiFormatted = balanceMist.slice(0, balanceMist.length - 9);
  const mistFormatted = balanceMist.slice(-9, -4);

  return `${suiFormatted}.${mistFormatted}`;
}

export function mistToSui(mist: string | number): number {
  const mistNum = typeof mist === 'string' ? parseInt(mist) : mist
  return mistNum / 1_000_000_000
}
