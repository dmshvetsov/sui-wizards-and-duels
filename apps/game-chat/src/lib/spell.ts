import { getPid, getPidLatest } from "./protocol/package";

export const spell = Object.freeze({
  id: getPidLatest(),
  method: {
    castPungere: `${getPidLatest()}::spell::cast_pungere`,
    castSuffocare: `${getPidLatest()}::spell::cast_suffocare`,
    castLkayxayin: `${getPidLatest()}::spell::cast_lkayxayin`,
  },
  type: {
    spell: `${getPid()}::spell::Spell`,
  },
  cost: {
    pungere: 4,
    suffocare: 5,
  },
})

export type Spell = keyof typeof spell.cost

export function getSpellName(value: unknown): Spell | null {
  if (typeof value !== 'string') {
    return null
  }
  if ((Object.keys(spell.cost)).includes(value as Spell)) {
    return value as Spell
  }
  return null
}
