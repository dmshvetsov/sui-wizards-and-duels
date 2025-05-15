module wizards_and_duels::spell;

use wizards_and_duels::effect::{Self, Effect};
use wizards_and_duels::damage::{Self, Damage};
use wizards_and_duels::force::Force;

const EWrongAmountForce: u64 = 1;

public fun cast_arrow (force: Force): Damage {
    let cost = 4;
    let (force_amount, caster) = force.consume();
    assert!(force_amount == cost, EWrongAmountForce);
    damage::cast(12, caster)
}

public fun cast_choke (force: Force): Effect {
    let cost = 5;
    let (force_amount, caster) = force.consume();
    assert!(force_amount == cost, EWrongAmountForce);
    effect::cast_choke(1, caster)
}

public fun cast_deflect(force: Force): Effect {
    let cost = 3;
    let (force_amount, caster) = force.consume();
    assert!(force_amount == cost, EWrongAmountForce);
    effect::cast_deflect(1, caster)
}

public fun cast_throw(force: Force): Effect {
    let cost = 2;
    let (force_amount, caster) = force.consume();
    assert!(force_amount == cost, EWrongAmountForce);
    effect::cast_throw(1, caster)
}

public fun cast_summon(force: Force): Damage {
    let cost = 6;
    let (force_amount, caster) = force.consume();
    assert!(force_amount == cost, EWrongAmountForce);
    damage::cast(21, caster)
}
