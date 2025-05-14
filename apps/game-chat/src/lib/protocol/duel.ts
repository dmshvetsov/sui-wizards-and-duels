import { getPid, getPidLatest } from "./package"

export type DuelistCap = {
  id: string,
  duel: string,
  wizard: string,
  opponent: string,
}

export type Duel = {
  id: string
  started_at: string
  wizard1: string
  wizard2: string
  // TODO: make it camel case
  wizard1_force: number
  // TODO: make it camel case
  wizard2_force: number
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
