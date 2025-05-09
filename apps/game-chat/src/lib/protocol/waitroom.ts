import { Transaction } from "@mysten/sui/transactions"
import { getPidLatest } from "./package"

export type Waitroom = {
  id: string
  queue: Array<{
    fields: {
      wizard1: string
      wizard2: string
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
 */
export function joinTx() {
  const tx = new Transaction()
  tx.moveCall({
    target: waitroom.method.join,
    arguments: [tx.object(waitroom.object.waitroom)],
  })
  // TODO: use slightly random gas price to avoid consensus issues if two players will join at the same time
  // tx.setGasBudget(5_000_000);
  // tx.setGasPrice(1_000);
  return tx
}

/**
 * Get a wait room leave transaction
 */
export function leaveTx() {
  const tx = new Transaction()
  tx.moveCall({
    target: waitroom.method.leave,
    arguments: [tx.object(waitroom.object.waitroom)],
  })
  // TODO: use slightly random gas price to avoid consensus issues if two players will join at the same time
  // tx.setGasBudget(5_000_000);
  // tx.setGasPrice(1_000);
  return tx
}

