module wizards_and_duels::engine;

/// Settle the outcome of a spell cast between two wizards
///
/// # Arguments
/// * `caster` - The address of the wizard casting the spell
/// * `target` - The address of the wizard targeted by the spell
/// * `damage` - The amount of damage the spell would deal
/// * `caster_force` - The current force of the caster
/// * `target_force` - The current force of the target
/// * `caster_effects` - Vector of effects on the caster [choke, thrown, deflect]
/// * `target_effects` - Vector of effects on the target [choke, thrown, deflect]
///
/// # Returns
/// * `(u64, u64, vector<u8>, vector<u8>)` - Updated (caster_force, target_force, caster_effects, target_effects)
public(package) fun settle(
    _caster: address,
    _target: address,
    damage: u64,
    caster_force: u64,
    target_force: u64,
    caster_effects: vector<u8>,
    target_effects: vector<u8>
): (u64, u64, vector<u8>, vector<u8>) {
    let mut mut_damage = damage;

    // Get current effect values
    let caster_choke = *vector::borrow(&caster_effects, 0);
    let caster_thrown = *vector::borrow(&caster_effects, 1);
    let caster_deflect = *vector::borrow(&caster_effects, 2);

    let target_choke = *vector::borrow(&target_effects, 0);
    let target_thrown = *vector::borrow(&target_effects, 1);
    let target_deflect = *vector::borrow(&target_effects, 2);

    // Create mutable copies for updating
    let mut new_target_force = target_force;
    let mut new_caster_choke = caster_choke;
    let mut new_caster_thrown = caster_thrown;
    let mut new_target_choke = target_choke;
    let mut new_target_deflect = target_deflect;

    // if target's deflect > 0 set damage to 0 and set caster's thrown to 0 and set deflect to 0
    if (target_deflect > 0) {
        mut_damage = 0;
        new_caster_thrown = 0;
        new_target_deflect = 0;
    };

    // if damage > 0 set caster's thrown to 0 and caster's choke to 0 and reduce target_force by damage but not less than 0
    if (mut_damage > 0) {
        new_caster_thrown = 0;
        new_caster_choke = 0;

        // Reduce target_force by damage but not less than 0
        if (target_force >= mut_damage) {
            new_target_force = target_force - mut_damage;
        } else {
            new_target_force = 0;
        };
    };

    // if target's choke > 0 them set target's deflect to 0
    if (target_choke > 0) {
        new_target_deflect = 0;
    };

    // if target's choke >= 3 them set target's force to 0
    if (target_choke >= 3) {
        new_target_force = 0;
    };

    // if caster's throw > 0 set target's summon effect and choke effect to 0 and set throw to 0
    if (caster_thrown > 0) {
        new_target_choke = 0;
        new_caster_thrown = 0;
    };

    (
        caster_force, 
        new_target_force, 
        vector[new_caster_choke, new_caster_thrown, caster_deflect], 
        vector[new_target_choke, target_thrown, new_target_deflect]
    )
}
