import { Transaction } from "@mysten/sui/transactions"
import { getPidLatest } from "./package"

export type Waitroom = {
  id: string
  queue: Array<{
    fields: {
      wizard1: string
      wizard2: string
      stake_amount: string
    },
  }>
}

export function getWaitromId(): string {
    const id = import.meta.env.VITE_WIZARDS_AND_DUELS_WAITROOM_OID
    if (!id) {
        throw new Error('Configuration error WAITROOM ID is not defined')
    }
    return id
}

const WAITROOM_PID_LATEST = getPidLatest()
export const waitroom = Object.freeze({
  id: WAITROOM_PID_LATEST,
  method: {
    join: `${WAITROOM_PID_LATEST}::waitroom::join`,
    leave: `${WAITROOM_PID_LATEST}::waitroom::leave`,
  },
  object: {
    waitroom: getWaitromId(),
  },
})

/**
 * Get a wait room join transaction
 * @param stakeAmountInMist - Stake amount in MIST (1 SUI = 1_000_000_000 MIST)
 */
export function joinTx(stakeAmountInMist: number) {
  const tx = new Transaction()
  tx.setGasBudget(10_000_000)
  const [stake] = tx.splitCoins(tx.gas, [stakeAmountInMist]);
  tx.moveCall({
    target: waitroom.method.join,
    arguments: [
      tx.object(waitroom.object.waitroom),
      stake,
    ],
  })
  return tx
}

/**
 * Get a wait room leave transaction
 */
export function leaveTx() {
  const tx = new Transaction()
  tx.setGasBudget(10_000_000)
  tx.moveCall({
    target: waitroom.method.leave,
    arguments: [tx.object(waitroom.object.waitroom)],
  })
  return tx
}

