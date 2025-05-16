module wizards_and_duels::effect;

public struct Effect {
    value: vector<u8>,
    caster: address,
}

/// Summation of deflection effect does not enhance the effect
public(package) fun cast_throw(throw_value: u8, caster: address): Effect {
    Effect { value: new_value(0, throw_value, 0), caster }
}

public(package) fun cast_choke(choke_value: u8, caster: address): Effect {
    Effect { value: new_value(choke_value, 0, 0), caster }
}

/// Deflect effect applies to a target, if the next target's spell can be deflected then that spell has no effect or damage
/// If next spell is not deflected then deflect effect is removed from the target
/// Summation of deflection effect does not enhance the effect
public(package) fun cast_deflect(deflect_value: u8, caster: address): Effect {
    Effect { value: new_value(0, 0, deflect_value), caster }
}

public(package) fun caster(effect: &Effect): address {
    effect.caster
}

public(package) fun apply(this: Effect, other: vector<u8>): vector<u8> {
    let Effect { value, caster: _ } = this;
    if (other.is_empty()) {
        return value
    };
    let choke = other[0] + value[0];
    let thrown = other[1] + value[1];
    let deflect = other[2] + value[2];
    new_value(choke, thrown, deflect)
}

public fun is_caster(this: &Effect, other_address: address): bool {
    this.caster == other_address
}

public(package) fun default_value(): vector<u8> {
    new_value(0, 0, 0)
}

//
// # private funcitons
//

fun new_value(choke: u8, throw: u8, deflect: u8): vector<u8> {
    vector[choke, throw, deflect]
}
