///  dapp to make proof of concept of the simplest implementation of a magic duel game
///  NOTE: this smart contract were build without considering the best practices of on-chain programming, including security
///  the sole purpose is to test a concept of using blockchain as a backend for a game
module magic_duel::game {
    use sui::dynamic_field as df;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    const SPELL_TEREBRARETE_DAMAGE: u16 = 14;
    const WIZARD_FORCE: u16 = 128;

    /// Error codes
    const ENotWizard: u64 = 2;

    struct DuelistCap has key {
        id: UID,
        opponent: address,
    }

    struct Opponent has store {
        force: u16,
    }

    public fun create_duel(
        wizard1_addr: address,
        wizard2_addr: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == wizard1_addr || sender == wizard2_addr, ENotWizard);

        let cap1 = DuelistCap {
            id: object::new(ctx),
            opponent: wizard2_addr,
        };
        df::add(&mut cap1.id, wizard2_addr, Opponent {
            force: WIZARD_FORCE,
        });
        transfer::transfer(cap1, wizard1_addr);


        let cap2 = DuelistCap {
            id: object::new(ctx),
            opponent: wizard1_addr,
        };
        df::add(&mut cap2.id, wizard1_addr, Opponent {
            force: WIZARD_FORCE
        });
        transfer::transfer(cap2, wizard2_addr);
    }

    public fun cast_spell(caster_cap: &DuelistCap) {
        let damage = SPELL_TEREBRARETE_DAMAGE;
        let opponent: &mut Opponent = df::borrow_mut(&mut caster_cap.id, caster_cap.opponent);
        if (opponent.force <= damage) {
            opponent.force = 0;
        } else {
            opponent.force = opponent.force - damage;
        };
    }
} 
