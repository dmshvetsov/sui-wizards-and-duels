import { SuiObjectResponse } from "@mysten/sui/client"
import { getPid, getPidLatest } from "./package"

export type WithOnChainRef<T> = T & {
  id: string,
  _version: string,
  _digest: string,
}

export type DuelistCap = {
  duel: string,
  wizard: string,
  opponent: string,
}

// TODO: make it camel case
export type Duel = {
  started_at: number
  wizard1: string
  wizard2: string
  wizard1_force: number
  wizard2_force: number
  /** effects touple choke, throw, deflect */
  wizard1_effects: [number, number, number]
  /** effects touple choke, throw, deflect */
  wizard2_effects: [number, number, number]
  /** current prize pool value in MIST */
  prize_pool: string
}

const PACKAGE_ID_V1 = getPid()
const PACKAGE_ID_LATEST = getPidLatest()

export const DUEL = Object.freeze({
  id: getPid(),
  method: {
    join: `${PACKAGE_ID_LATEST}::duel::cast_spell`,
  },
  type: {
    duelCap: `${PACKAGE_ID_V1}::duel::DuelistCap`,
    spell: `${PACKAGE_ID_V1}::duel::Spell`,
  },
})

export function getInitialSharedVersion(data: SuiObjectResponse) {
  const obj = data.data
  if (obj && 'owner' in obj && obj.owner != null && typeof obj.owner === 'object' && 'Shared' in obj.owner) {
    return obj.owner.Shared.initial_shared_version
  }
  return null
}
