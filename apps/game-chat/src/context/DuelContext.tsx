import { createContext, useContext, PropsWithChildren } from 'react'

type DuelContextValue = {
  duelId: string
}

const DuelContext = createContext<DuelContextValue>({ duelId: '' })

export function DuelProvider({ children, duelId }: PropsWithChildren<{ duelId: string }>) {
  // TODO: fetch from Sui blockchain Duel by duelId
  // TODO: if duel not found use null object pattern to display empty duel with a message "Duel not found"

  return (
    <DuelContext.Provider value={{ duelId }}>
      {children}
    </DuelContext.Provider>
  )
}

export function useDuel() {
  const context = useContext(DuelContext)
  if (!context) {
    throw new Error('useDuel must be used within a DuelProvider')
  }
  return context
}