import { getPid, getPidLatest } from "./package";

export const spell = Object.freeze({
  id: getPidLatest(),
  method: {
    castArrow: `${getPidLatest()}::spell::cast_arrow`,
    castChoke: `${getPidLatest()}::spell::cast_choke`,
    castDeflect: `${getPidLatest()}::spell::cast_deflect`,
    castThrow: `${getPidLatest()}::spell::cast_throw`,
  },
  type: {
    spell: `${getPid()}::spell::Spell`,
  },
})

// TODO: fetch from on chain module
const SPELL_SPEC = Object.freeze({
  arrow: {
    cost: 4,
    module: 'damage',
    castMethod: `${getPidLatest()}::spell::cast_arrow`,
    applyMethod: `${getPidLatest()}::damage::apply`,
  },
  choke: {
    cost: 5,
    module: 'effect',
    castMethod: `${getPidLatest()}::spell::cast_choke`,
    applyMethod: `${getPidLatest()}::duel::cast_effect`,
  },
  deflect: {
    cost: 3,
    module: 'effect',
    castMethod: `${getPidLatest()}::spell::cast_deflect`,
    applyMethod: `${getPidLatest()}::duel::cast_effect`,
  },
  throw: {
    cost: 2,
    module: 'effect',
    castMethod: `${getPidLatest()}::spell::cast_throw`,
    applyMethod: `${getPidLatest()}::duel::cast_effect`,
  },
})

export type Spell = keyof typeof SPELL_SPEC

export function getSpellSpec(name: unknown) {
  if (typeof name !== 'string') {
    return null
  }
  const spec = SPELL_SPEC[name as Spell]
  if (!spec) {
    return null
  }
  return spec
}
