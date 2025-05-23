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
///
/// Rules:
/// - If damage > 0 and target has deflect, set target damage to 0, deflect half of damage to caster and consume deflect
/// - If damage > 0, reset caster's throw and choke effects and reduce target's force
/// - If target has choke, remove deflect
/// - If target has choke level 3 or higher, reduce force to 0
/// - If target has throw, remove choke from caster, remove delfect from target and consume target throw
/// - For choke effect: applied to target, compoundable, removes deflect
/// - For throw effect: applied to target, removes choke from caster if successful
/// - For deflect effect: applied to caster, not compoundable
///
/// choke effect applies on target, throw applies on target, deflect applies on caster
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
    let mut new_caster_force = caster_force;
    let mut new_caster_choke = caster_choke;
    let mut new_caster_thrown = caster_thrown;
    let mut new_caster_deflect = caster_deflect;
    let mut new_target_force = target_force;
    let mut new_target_deflect = target_deflect;
    let mut new_target_thrown = target_thrown;

    // deflect defends from damage
    if (mut_damage > 0 && target_deflect > 0) {
        mut_damage = 0;
        new_target_deflect = 0;
        if (caster_deflect > 0) {
            new_caster_deflect = 0;
        } else {
            new_caster_force = new_caster_force - (damage / 2);
        };
    };

    // cause damage
    if (mut_damage > 0) {
        // Reset caster's throw and choke effects when dealing damage
        new_caster_thrown = 0;
        new_caster_choke = 0;

        // Apply damage to target's force
        if (target_force >= mut_damage) {
            new_target_force = target_force - mut_damage;
        } else {
            new_target_force = 0;
        };
    };

    if (target_choke > 0) {
        // deflect can't defend from choke and choke remove deflect
        new_target_deflect = 0;
        if (target_choke >= 3) {
            // If target has choke level 3 or higher, reduce force to 0
            new_target_force = 0;
        };
    };

    if (target_thrown > 0) {
        // throw safes from choke
        new_caster_choke = 0; 
        // throw removes deflect from target
        new_target_deflect = 0; 
        // throw effect must be consumed
        new_target_thrown = 0; 
    };

    // Cap throw and deflect at 1
    if (new_caster_thrown > 1) {
        new_caster_thrown = 1;
    };
    if (new_caster_deflect > 1) {
        new_caster_deflect = 1;
    };

    (
        new_caster_force,
        new_target_force,
        vector[new_caster_choke, new_caster_thrown, new_caster_deflect],
        vector[target_choke, new_target_thrown, new_target_deflect]
    )
}
