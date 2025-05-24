module wizards_and_duels::duel;

use sui::clock::Clock;
use sui::coin;
use sui::sui::SUI;
use sui::balance::{Self, Balance};
use wizards_and_duels::force::{Self, Force};
use wizards_and_duels::effect::{Self, Effect};
use wizards_and_duels::engine;

const EBadTx: u64 = 1;
const ENotDuelWizard: u64 = 2;
const EDuelNotInAction: u64 = 3;
// const EDuelFinished: u64 = 4; no longer in use
// const EDuelExpired: u64 = 5;
const ENotEnoughForce: u64 = 6;
const EDuelStillInAction: u64 = 7;
const ENotCaster: u64 = 8;

// default duel start countdown 30 seconds
const DEFAULT_DUEL_START_COUNTDOWN_MS: u64 = 30_000;
// max duel start countdown 48 hours
const MAX_DUEL_START_COUNTDOWN_MS: u64 = 172_800_000;

public struct Duel has key {
    id: UID,
    started_at: u64,
    wizard1: address,
    wizard2: address,
    wizard1_force: u64,
    wizard2_force: u64,
    wizard2_effects: vector<u8>,
    wizard1_effects: vector<u8>,
    prize_pool: Balance<SUI>,
}

public struct DuelistCap has key {
    id: UID,
    duel: ID,
    wizard: address,
    opponent: address,
}

public struct AdminCap has key {
    id: UID,
}

public fun create(player_1: address, player_2: address, prize_pool: Balance<SUI>, ctx: &mut TxContext) {
    let duel = Duel {
        id: object::new(ctx),
        wizard1: player_1,
        wizard2: player_2,
        wizard1_force: 128,
        wizard2_force: 128,
        started_at: 0,
        wizard1_effects: effect::default_value(),
        wizard2_effects: effect::default_value(),
        prize_pool
    };

    let duel_id = duel.id.to_address().to_id();
    transfer::share_object(duel);

    transfer::transfer(DuelistCap {
        id: object::new(ctx),
        duel: duel_id,
        wizard: player_1,
        opponent: player_2,
    }, player_1);

    transfer::transfer(DuelistCap {
        id: object::new(ctx),
        duel: duel_id,
        wizard: player_2,
        opponent: player_1,
    }, player_2);
}

public fun start(duel: &mut Duel, start_countdown_sec: u64, now: &Clock, ctx: &mut TxContext) {
    assert!(duel.started_at == 0, EBadTx);
    assert!(duel.wizard1 != @0x0 && duel.wizard2 != @0x0, EBadTx);
    let sender = ctx.sender();
    assert!(duel.wizard1 == sender || duel.wizard2 == sender, ENotDuelWizard);

    if (start_countdown_sec == 0 || start_countdown_sec * 1000 > MAX_DUEL_START_COUNTDOWN_MS) {
        duel.started_at = now.timestamp_ms() + DEFAULT_DUEL_START_COUNTDOWN_MS;
    } else {
        duel.started_at = now.timestamp_ms() + start_countdown_sec * 1000;
    }
}

public fun use_force(duel: &mut Duel, duelistCap: &DuelistCap, amount: u64, ctx: &TxContext): Force {
    let sender = tx_context::sender(ctx);
    assert!(duelistCap.wizard == sender, ENotDuelWizard);
    if (duel.wizard1 == sender) {
        assert!(duel.wizard1_force > amount, ENotEnoughForce);
        duel.wizard1_force = duel.wizard1_force - amount;
    } else {
        assert!(duel.wizard2_force > amount, ENotEnoughForce);
        duel.wizard2_force = duel.wizard2_force - amount;
    };
    force::create(amount, sender)
}

public(package) fun cast_damage(duel: &mut Duel, caster: address, target: address, amount: u64) {
    assert!(caster == duel.wizard1 || caster == duel.wizard2, ENotDuelWizard);

    if (duel.wizard1 == target) {
        let (caster_force, target_force, caster_effects, target_effects) = engine::settle(
            caster,
            target,
            amount,
            duel.wizard2_force,
            duel.wizard1_force,
            duel.wizard2_effects,
            duel.wizard1_effects,
        );
        duel.wizard2_force = caster_force;
        duel.wizard1_force = target_force;
        duel.wizard2_effects = caster_effects;
        duel.wizard1_effects = target_effects;
        return
    };
    if (duel.wizard2 == target) {
        let (caster_force, target_force, caster_effects, target_effects) = engine::settle(
            caster,
            target,
            amount,
            duel.wizard1_force,
            duel.wizard2_force,
            duel.wizard1_effects,
            duel.wizard2_effects,
        );
        duel.wizard1_force = caster_force;
        duel.wizard2_force = target_force;
        duel.wizard1_effects = caster_effects;
        duel.wizard2_effects = target_effects;
        return
    };
    abort(ENotDuelWizard)
}

public fun cast_effect(duel: &mut Duel, effect: Effect, target: address, ctx: &TxContext) {
    let caster = ctx.sender();
    assert!(caster == duel.wizard1 || caster == duel.wizard2, ENotDuelWizard);
    assert!(effect.is_caster(caster), ENotCaster);

    if (duel.wizard1 == caster && duel.wizard2 == target) {
        duel.wizard2_effects = effect.apply(duel.wizard2_effects);
        let (_, target_force, caster_effects, target_effects) =engine::settle(
            caster,
            target,
            0,
            duel.wizard1_force,
            duel.wizard2_force,
            duel.wizard1_effects,
            duel.wizard2_effects,
        );
        duel.wizard2_force = target_force;
        duel.wizard1_effects = caster_effects;
        duel.wizard2_effects = target_effects;
    } else if (duel.wizard2 == caster && duel.wizard1 == target) {
        duel.wizard1_effects = effect.apply(duel.wizard1_effects);
        let (_, target_force, caster_effects, target_effects) =engine::settle(
            caster,
            target,
            0,
            duel.wizard2_force,
            duel.wizard1_force,
            duel.wizard2_effects,
            duel.wizard1_effects,
        );
        duel.wizard1_force = target_force;
        duel.wizard2_effects = caster_effects;
        duel.wizard1_effects = target_effects;
    } else if (duel.wizard1 == caster && duel.wizard1 == target) {
        duel.wizard1_effects = effect.apply(duel.wizard1_effects);
        let (_, target_force, _, target_effects) =engine::settle(
            caster,
            target,
            0,
            duel.wizard1_force,
            duel.wizard1_force,
            duel.wizard1_effects,
            duel.wizard1_effects,
        );
        duel.wizard1_force = target_force;
        duel.wizard1_effects = target_effects;
    } else if (duel.wizard2 == caster && duel.wizard2 == target) {
        duel.wizard2_effects = effect.apply(duel.wizard2_effects);
        let (_, target_force, _, target_effects) =engine::settle(
            caster,
            target,
            0,
            duel.wizard2_force,
            duel.wizard2_force,
            duel.wizard2_effects,
            duel.wizard2_effects,
        );
        duel.wizard2_force = target_force;
        duel.wizard2_effects = target_effects;
    } else {
        abort(ENotDuelWizard)
    }
}

public(package) fun defeat(duel: &mut Duel, target: address) {
    if (duel.wizard1 == target) {
        duel.wizard1_force = 0;
        return
    };
    if (duel.wizard2 == target) {
        duel.wizard2_force = 0;
        return
    };
    abort(ENotDuelWizard)
}

public fun end(duel: &mut Duel, duelistCap: DuelistCap, ctx: &mut TxContext) {
    assert!(duel.started_at != 0, EDuelNotInAction);
    assert!(duel.wizard1_force == 0 || duel.wizard2_force == 0, EDuelStillInAction);

    let sender = tx_context::sender(ctx);
    let DuelistCap { id, .. } = duelistCap;
    object::delete(id);

    // Winner gets the entire prize pool
    if (duel.wizard1 == sender && duel.wizard2_force == 0) {
        let prize_balance = balance::withdraw_all(&mut duel.prize_pool);
        transfer::public_transfer(
            coin::from_balance(prize_balance, ctx),
            duel.wizard1
        );
    } else if (duel.wizard2 == sender && duel.wizard1_force == 0) {
        let prize_balance = balance::withdraw_all(&mut duel.prize_pool);
        transfer::public_transfer(
            coin::from_balance(prize_balance, ctx),
            duel.wizard2
        );
    }
}

//
// # Initialization
//

fun init(ctx: &mut TxContext) {
    let adminCap = AdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(adminCap, ctx.sender());
}
