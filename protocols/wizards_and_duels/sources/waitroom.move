module wizards_and_duels::waitroom;

use wizards_and_duels::duel;
use sui::coin::Coin;
use sui::sui::SUI;
use sui::balance::{Self, Balance};

//
// Constants and Errors
//

// Allowed stake amounts
const STAKE_0_SUI: u64 = 0;
const STAKE_1_SUI: u64 = 1_000_000_000;
const STAKE_5_SUI: u64 = 5_000_000_000;
const STAKE_10_SUI: u64 = 10_000_000_000;
const STAKE_25_SUI: u64 = 25_000_000_000;
const STAKE_50_SUI: u64 = 50_000_000_000;
const STAKE_100_SUI: u64 = 100_000_000_000;

const EInvalidStakeAmount: u64 = 10;

//
// Structs
//

public struct AdminCap has key {
    id: UID,
}

public struct Pairing has store, drop {
    wizard1: address,
    wizard2: address,
    stake_amount: u64
}

public struct Waitroom has key {
    id: UID,
    queue: vector<Pairing>,
    balance: Balance<SUI>
}

const ENotInWaitroom: u64 = 1;

//
// Public API
//

/// Join the wait room to be paired with the next player
public fun join(waitroom: &mut Waitroom, stake: Coin<SUI>, ctx: &mut TxContext) {
    let sender = ctx.sender();
    let stake_amount = stake.value();
    assert!(is_valid_stake_amount(stake_amount), EInvalidStakeAmount);

    // Look for a matching stake amount in the queue
    let queue_length = vector::length(&waitroom.queue);
    let mut i = 0;
    while (i < queue_length) {
        let pairing = vector::borrow(&waitroom.queue, i);
        if (pairing.stake_amount == stake_amount && sender != pairing.wizard1) {
            // Found a match, remove it from queue and create duel
            let mut prize_pool = waitroom.balance.split(stake_amount);
            let matched_pairing = vector::remove(&mut waitroom.queue, i);
            prize_pool.join(stake.into_balance());
            duel::create(matched_pairing.wizard1, sender, prize_pool, ctx);
            return
        };
        i = i + 1;
    };

    waitroom.balance.join(stake.into_balance());

    // No match found, add to queue
    vector::push_back(&mut waitroom.queue, Pairing {
        wizard1: sender,
        wizard2: @0x0,
        stake_amount
    });
}

/// Leave the wait room to not be paired for a duel
public fun leave(waitroom: &mut Waitroom, ctx: &mut TxContext) {
    let sender = ctx.sender();
    let mut pairing_idx = waitroom.queue.find_index!(|pairing| pairing.wizard1 == sender);
    assert!(pairing_idx.is_some(), ENotInWaitroom);

    let pairing = vector::remove(&mut waitroom.queue, pairing_idx.extract());
    let stake = waitroom.balance.split(pairing.stake_amount);
    transfer::public_transfer(stake.into_coin(ctx), pairing.wizard1);
}

//
// # Private function
//


fun is_valid_stake_amount(amount: u64): bool {
    amount == STAKE_0_SUI ||
    amount == STAKE_1_SUI ||
    amount == STAKE_5_SUI ||
    amount == STAKE_10_SUI ||
    amount == STAKE_25_SUI ||
    amount == STAKE_50_SUI ||
    amount == STAKE_100_SUI
}
//
// # Initialization
//

fun init(ctx: &mut TxContext) {
    transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
    let wr = Waitroom { id: object::new(ctx), queue: vector::empty(), balance: balance::zero()  };
    transfer::share_object(wr);
}

//
// # Admin functions
//

public fun reset(_admin_cap: &AdminCap, waitroom: &mut Waitroom) {
    waitroom.queue = vector::empty();
}
