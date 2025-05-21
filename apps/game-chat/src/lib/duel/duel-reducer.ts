/**
 * Duel reducer for managing practice duel state
 */

export type WizardEffects = [
  /** choke */
  number,
  /** deflect */
  number,
  /** throw  */
  number,
]

export type SpellType = 'damage' | 'effect'

export interface SpellSpec {
  name: string
  cost: number
  type: SpellType
  damage?: number
  effect?: {
    type: 'choke' | 'throw' | 'deflect'
    value: number
  }
}

// Predefined spells with their costs and effects
export const SPELLS: Record<string, SpellSpec> = {
  arrow: {
    name: 'arrow',
    cost: 4,
    type: 'damage',
    damage: 15,
  },
  choke: {
    name: 'choke',
    cost: 5,
    type: 'effect',
    effect: {
      type: 'choke',
      value: 1,
    },
  },
  deflect: {
    name: 'deflect',
    cost: 3,
    type: 'effect',
    effect: {
      type: 'deflect',
      value: 1,
    },
  },
  throw: {
    name: 'throw',
    cost: 2,
    type: 'effect',
    effect: {
      type: 'throw',
      value: 1,
    },
  },
}

export interface DuelWizard {
  id: string
  force: number
  effects: WizardEffects
}

export interface DuelState {
  id: string
  wizard1: DuelWizard
  wizard2: DuelWizard
  startedAt: number
}

// Action types
export type DuelAction =
  | { type: 'START_DUEL'; payload: { countdownSeconds: number } }
  | {
      type: 'CAST_SPELL'
      payload: {
        casterId: string
        spellName: string
        targetId: string
      }
    }
  | {
      type: 'SET_WIZARD'
      payload: {
        key: 'wizard1' | 'wizard2'
        name: string
        force: number
      }
    }
  | {
      type: 'RESET_DUEL'
      payload: {
        wizard1Force?: number
        wizard2Force?: number
      }
    }

/**
 * Create initial duel state
 */
export function createInitialDuelState(params: {
  id: string,
  wizard1Id: string,
  wizard2Id: string,
  initialForce?: number,
  startedAt?: number,
}): DuelState {
  return {
    id: params.id,
    wizard1: {
      id: params.wizard1Id,
      force: params.initialForce ?? 128,
      effects: [0, 0, 0],
    },
    wizard2: {
      id: params.wizard2Id,
      force: params.initialForce ?? 128,
      effects: [0, 0, 0],
    },
    startedAt: params.startedAt ?? 0,
  }
}

/**
 * Check if the duel has started
 */
export function hasStarted(state: DuelState): boolean {
  return state.startedAt !== 0 && Date.now() >= state.startedAt
}

/**
 * Check if the duel has finished (one wizard has 0 force)
 */
export function hasFinished(state: DuelState): boolean {
  return state.wizard1.force === 0 || state.wizard2.force === 0
}

/**
 * Get the winner of the duel
 * @returns The ID of the winning wizard, or null if no winner yet
 */
export function getWinner(state: DuelState): string | null {
  if (state.wizard1.force === 0) {
    return state.wizard2.id
  }
  if (state.wizard2.force === 0) {
    return state.wizard1.id
  }
  return null
}

/**
 * Get the loser of the duel
 * @returns The ID of the losing wizard, or null if no loser yet
 */
export function getLoser(state: DuelState): string | null {
  if (state.wizard1.force === 0) {
    return state.wizard1.id
  }
  if (state.wizard2.force === 0) {
    return state.wizard2.id
  }
  return null
}

/**
 * Get a wizard by ID
 */
function getWizardById(state: DuelState, wizardId: string): DuelWizard | null {
  if (state.wizard1.id === wizardId) {
    return state.wizard1
  }
  if (state.wizard2.id === wizardId) {
    return state.wizard2
  }
  return null
}

/**
 * Apply damage from a spell
 */
function applyDamage(
  state: DuelState,
  caster: DuelWizard,
  target: DuelWizard,
  damage: number
): DuelState {
  // Create a new state to avoid mutations
  const newState = { ...state }

  // Get new references to wizards
  const newCaster: DuelWizard =
    caster.id === state.wizard1.id
      ? { ...newState.wizard1, effects: [...newState.wizard1.effects] }
      : { ...newState.wizard2, effects: [...newState.wizard2.effects] }

  const newTarget: DuelWizard =
    target.id === state.wizard1.id
      ? { ...newState.wizard1, effects: [...newState.wizard1.effects] }
      : { ...newState.wizard2, effects: [...newState.wizard2.effects] }

  // Update the state with new wizard references
  if (newCaster.id === newState.wizard1.id) {
    newState.wizard1 = newCaster
  } else {
    newState.wizard2 = newCaster
  }

  if (newTarget.id === newState.wizard1.id) {
    newState.wizard1 = newTarget
  } else {
    newState.wizard2 = newTarget
  }

  // If target has deflect, nullify damage and consume deflect
  if (newTarget.effects[2] > 0) {
    newTarget.effects[2] = 0
    return newState
  }

  // Apply damage to target's force
  newTarget.force = Math.max(0, newTarget.force - damage)

  // Reset caster's throw and choke effects when dealing damage
  newCaster.effects[0] = 0 // Reset choke
  newCaster.effects[1] = 0 // Reset throw

  // If target has choke level 3 or higher, reduce force to 0
  if (newTarget.effects[0] >= 3) {
    newTarget.force = 0
  }

  return newState
}

/**
 * Apply an effect from a spell
 */
function applyEffect(
  state: DuelState,
  caster: DuelWizard,
  target: DuelWizard,
  effectType: 'choke' | 'throw' | 'deflect',
  value: number
): DuelState {
  console.debug('apply effect', state, caster, target, effectType, value)

  // Get new references to wizards
  const newCasterEffects: WizardEffects =
    caster.id === state.wizard1.id ? [...state.wizard1.effects] : [...state.wizard2.effects]

  const newTargetEffects: WizardEffects =
    target.id === state.wizard1.id ? [...state.wizard1.effects] : [...state.wizard2.effects]

  switch (effectType) {
    case 'choke':
      // Choke is applied to the target and is compoundable up to 3
      newTargetEffects[0] = Math.min(3, newTargetEffects[0] + value)

      // If choke is applied, remove deflect
      if (newTargetEffects[0] > 0) {
        newTargetEffects[2] = 0 // Remove deflect
      }

      // If choke reaches level 3, reduce force to 0
      if (newTargetEffects[0] >= 3) {
        // newTargetEffects.force = 0
        return {
          ...state,
          wizard1: {
            ...state.wizard1,
            force: target.id === state.wizard1.id ? 0 : state.wizard1.force,
            effects:
              target.id === state.wizard1.id
                ? newTargetEffects
                : caster.id === state.wizard1.id
                  ? newCasterEffects
                  : state.wizard1.effects,
          },
          wizard2: {
            ...state.wizard2,
            force: target.id === state.wizard2.id ? 0 : state.wizard2.force,
            effects:
              target.id === state.wizard2.id
                ? newTargetEffects
                : caster.id === state.wizard2.id
                  ? newCasterEffects
                  : state.wizard2.effects,
          },
        }
      }

      return {
        ...state,
        wizard1: {
          ...state.wizard1,
          effects:
            target.id === state.wizard1.id
              ? newTargetEffects
              : caster.id === state.wizard1.id
                ? newCasterEffects
                : state.wizard1.effects,
        },
        wizard2: {
          ...state.wizard2,
          effects:
            target.id === state.wizard2.id
              ? newTargetEffects
              : caster.id === state.wizard2.id
                ? newCasterEffects
                : state.wizard2.effects,
        },
      }

    case 'throw':
      // If throw is applied and target doesn't have deflect, remove choke from caster
      if (newTargetEffects[2] === 0) {
        newCasterEffects[0] = 0 // Remove choke from caster
      } else {
        // remove target deflect effect
        newTargetEffects[2] = 0
      }
      return {
        ...state,
        wizard1: {
          ...state.wizard1,
          effects:
            target.id === state.wizard1.id
              ? newTargetEffects
              : caster.id === state.wizard1.id
                ? newCasterEffects
                : state.wizard1.effects,
        },
        wizard2: {
          ...state.wizard2,
          effects:
            target.id === state.wizard2.id
              ? newTargetEffects
              : caster.id === state.wizard2.id
                ? newCasterEffects
                : state.wizard2.effects,
        },
      }

    case 'deflect':
      // Deflect is applied to the caster (self) and is not compoundable
      newTargetEffects[2] = 1
      return {
        ...state,
        wizard1: {
          ...state.wizard1,
          effects:
            target.id === state.wizard1.id
              ? newTargetEffects
              : caster.id === state.wizard1.id
                ? newCasterEffects
                : state.wizard1.effects,
        },
        wizard2: {
          ...state.wizard2,
          effects:
            target.id === state.wizard2.id
              ? newTargetEffects
              : caster.id === state.wizard2.id
                ? newCasterEffects
                : state.wizard2.effects,
        },
      }
  }
}

/**
 * Duel reducer function
 */
export function duelReducer(state: DuelState, action: DuelAction): DuelState {
  switch (action.type) {
    case 'START_DUEL': {
      if (state.startedAt !== 0) {
        return state // Duel already started
      }
      return {
        ...state,
        startedAt: Date.now() + action.payload.countdownSeconds * 1000,
      }
    }

    case 'CAST_SPELL': {
      const { casterId, spellName, targetId } = action.payload

      // Check if duel has started
      if (!hasStarted(state) || hasFinished(state)) {
        console.warn('Duel not started or already finished')
        return state
      }

      // Get spell specification
      const spell = SPELLS[spellName.toLowerCase()]
      if (!spell) {
        console.warn('Spell not found', spellName)
        return state
      }

      // Get caster and target
      const caster = getWizardById(state, casterId)
      const target = getWizardById(state, targetId)

      if (!caster || !target) {
        console.warn('Caster or target not found')
        return state
      }

      // Check if caster has enough force
      if (caster.force < spell.cost) {
        return state
      }

      // Create a new state with reduced caster force
      let newState = { ...state }
      const newCaster =
        caster.id === state.wizard1.id
          ? { ...newState.wizard1, force: newState.wizard1.force - spell.cost }
          : { ...newState.wizard2, force: newState.wizard2.force - spell.cost }

      if (newCaster.id === newState.wizard1.id) {
        newState.wizard1 = newCaster
      } else {
        newState.wizard2 = newCaster
      }

      // Apply spell effects
      if (spell.type === 'damage') {
        newState = applyDamage(newState, newCaster, target, spell.damage ?? 0)
      } else if (spell.type === 'effect' && spell.effect) {
        newState = applyEffect(newState, newCaster, target, spell.effect.type, spell.effect.value)
      }

      return newState
    }

    case 'SET_WIZARD': {
      const { key, name, force } = action.payload

      if (key !== 'wizard1' && key !== 'wizard2') {
        console.warn(`[SET_WIZARD] | Invalid wizard key ${key}`)
        return state
      }

      return {
        ...state,
        [key]: {
          ...state[key],
          name,
          force,
        },
      }
    }

    case 'RESET_DUEL': {
      const { wizard1Force = 128, wizard2Force = 128 } = action.payload

      // Reset the duel state but keep the wizard IDs
      return {
        ...state,
        wizard1: {
          ...state.wizard1,
          force: wizard1Force,
          effects: [0, 0, 0],
        },
        wizard2: {
          ...state.wizard2,
          force: wizard2Force,
          effects: [0, 0, 0],
        },
        startedAt: 0,
      }
    }

    default:
      return state
  }
}
