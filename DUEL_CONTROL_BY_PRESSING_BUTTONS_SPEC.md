# Control duels by pressing keyboard buttons

Replace spell casting by typing spells in the chat by pressing buttons.

## Spell casting UI spec

- animation library `motion` and `motion/react`
- sound effects library `howl`
- spell preparing state sound path `/sfx/spell-preparing.ogg`
- spell cast spell steps key press sound use `SFX.spellCast` in `lib/utils/sfx.ts` 
- failed spell sound `/sfx/spell-error.ogg`
- spell casting sounds are already implemented for each spell

### Casting with key pressing

This specification defines hot players casts spells in the game.

First step, choose target:
- press 1 to cast spell on yourself
- press 2 to cast spell on opponent

Second step, choose spell:
- press i to cast choke spell
- press j to cast arrow spell
- press k to cast deflect spell
- press l to cast throw spell

### Casting UI

Consist of two elements
1. Spell book
2. Wizard characters, one for player and another for his opponent

Wizard character states:
- ready (ready for actions)
- preparing (preparing spell)
- casting (applying spell to target)
- affected (receiving negative spell effect, choke, thrown)
- damaged
- defeated

UI display state:
- idle
- preparing, display loading spin instead of spell casting icons.
- action, dim whole screen with 0.5 opacity black color. Display wizards characters 50% bigger, animate wizard characters left wizards moves 20% to left, right wizard moves 20% to right.


Duel action user interface displays "spell book". Spell book contains list of actions for the 2 steps of "Casting with key pressing" section. First step icons with corresponding letter key bellow icons "1", "2" for choosing target. Second step spell icons with corresponding letter below icons to cast spells "i", "j", "k", or "l".

- UI initially displays the first step icons, player wizard state ready
- user press the first step key, player wizard state ready
- UI displays the second step icons, player wizard state ready
- user press the second step key, player wizard state ready
- UI displays preparing state, key presses disabled, player wizard state preparing
- if spell transaction succeeded
  - UI displays action state
  - UI update wizards force
  - UI update wizards effects
  - after 2 seconds switch UI to idle state
- if spell transaction fails
  - play sound of spell error
  - switch UI to idle state immediately

### UI Loading state

### UI action state

## Game log spec

Use the game chat as a game action log. `!<spell name>` for spells with player (self) target, `@<spell name>` for spells when target is opponent.

Spell will be logged to the game chat immediately as player or opponent casts it.

As soon as spell blockchain transaction succeeded on the blockchain log spell force cost, effects or/and damage in the game log chat. 

Casting spell cost example `<player display name> -4 force used`. 

Damage example `<player display name> -12 force damage`

Effect examples `<player display name> has been choked 1/3`, `<player display name> has been thrown`, `<player display name> has spell deflection`

On spell errors add error entry to the game log.
