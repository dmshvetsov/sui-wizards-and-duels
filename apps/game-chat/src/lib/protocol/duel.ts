import { getPid, getPidLatest } from "./package"

export type DuelistCap = {
  id: string,
  duel: string,
  wizard: string,
  opponent: string,
}

// TODO: make it camel case
export type Duel = {
  id: string
  started_at: number
  wizard1: string
  wizard2: string
  wizard1_force: number
  wizard2_force: number
  /** effects touple choke, throw, deflect */
  wizard1_effects: [number, number, number]
  /** effects touple choke, throw, deflect */
  wizard2_effects: [number, number, number]
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
