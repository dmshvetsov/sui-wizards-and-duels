module wizards_and_duels::waitroom;

use wizards_and_duels::duel;

public struct AdminCap has key {
    id: UID,
}

public struct InitCap has key {
    id: UID,
}

public struct Pairing has store, drop {
    wizard1: address,
    wizard2: address,
}

public struct Waitroom has key {
    id: UID,
    queue: vector<Pairing>
}

const ENotInWaitroom: u64 = 1;

fun init(ctx: &mut TxContext) {
    transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
    transfer::transfer(InitCap { id: object::new(ctx) }, ctx.sender());
}

public fun init_config(init_cap: InitCap, ctx: &mut TxContext) {
    let wr = Waitroom { id: object::new(ctx), queue: vector::empty() };

    let InitCap { id } = init_cap;
    object::delete(id);

    transfer::share_object(wr);
}

public fun join(waitroom: &mut Waitroom, ctx: &mut TxContext) {
    if (vector::length(&waitroom.queue) > 0) {
        let pairing = vector::pop_back(&mut waitroom.queue);
        duel::create(pairing.wizard1, ctx.sender(), ctx);
        return
    };
    // TODO: add ability to crrate a duel with invited address as an opponent
    vector::push_back(&mut waitroom.queue, Pairing { wizard1: ctx.sender(), wizard2: @0x0 });
}

public fun leave(waitroom: &mut Waitroom, ctx: &mut TxContext) {
    let sender = ctx.sender();
    let mut pairing_idx = waitroom.queue.find_index!(|pairing| pairing.wizard1 == sender);
    assert!(pairing_idx.is_some(), ENotInWaitroom);
    vector::remove(&mut waitroom.queue, pairing_idx.extract());
}

public fun reset(_admin_cap: &AdminCap, waitroom: &mut Waitroom) {
    waitroom.queue = vector::empty();
}
