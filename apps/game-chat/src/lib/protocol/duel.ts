import { getPid, getPidLatest } from "./package"

export type DuelistCap = {
  id: string,
  duel: string,
  wizard: string,
  opponent: string,
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
  },
})
