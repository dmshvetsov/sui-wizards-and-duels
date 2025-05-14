module wizards_and_duels::force;

public struct Force {
    value: u64,
    caster: address,
}

public(package) fun create(value: u64, caster: address): Force {
    Force { value, caster }
}

public(package) fun consume(force: Force): (u64, address) {
    let Force { value, caster } = force;
    (value, caster)
}
