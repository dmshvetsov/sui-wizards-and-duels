module wizards_and_duels::spell;

use wizards_and_duels::force::Force;
use wizards_and_duels::damage::{Self, Damage};

const EWrongAmountForce: u64 = 1;

public fun cast_pungere (force: Force): Damage {
    let cost = 4;
    let (force_amount, caster) = force.consume();
    assert!(force_amount == cost, EWrongAmountForce);
    damage::cast(12, caster)
}

public fun cast_suffocare (force: Force): Damage {
    let cost = 5;
    let (force_amount, caster) = force.consume();
    assert!(force_amount == cost, EWrongAmountForce);
    damage::cast(1, caster)
}
