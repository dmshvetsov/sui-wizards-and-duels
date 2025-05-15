module wizards_and_duels::damage;

use wizards_and_duels::duel::Duel;

const ENotCaster : u64 = 1;

public struct Damage {
    value: u64,
    caster: address,
}

public(package) fun cast(value: u64, caster: address): Damage {
    Damage { value, caster }
}

public fun apply(damage: Damage, duel: &mut Duel, target: address, ctx: &TxContext) {
    assert!(ctx.sender() == damage.caster, ENotCaster);
    let Damage { value, caster } = damage;
    duel.cast_damage(caster, target, value);
}
