///  dapp to make proof of concept of the simplest implementation of a magic duel game
///  NOTE: this smart contract were build without considering the best practices of on-chain programming, including security
///  the sole purpose is to test a concept of using blockchain as a backend for a game
module magic_duel::game {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    const SPELL_TEREBRARETE_DAMAGE: u16 = 14;
    const WIZARD_FORCE: u16 = 128;

    /// Error codes
    const ENotWizard: u64 = 2;

    struct DuelistCap has key {
        id: UID,
        opponent_force: u16,
        opponent: address,
    }

    public fun create_duel(
        wizard1_addr: address,
        wizard2_addr: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == wizard1_addr || sender == wizard2_addr, ENotWizard);

        transfer::transfer(DuelistCap {
            id: object::new(ctx),
            opponent_force: WIZARD_FORCE,
            opponent: wizard2_addr,
        }, wizard1_addr);
        transfer::transfer(DuelistCap {
            id: object::new(ctx),
            opponent_force: WIZARD_FORCE,
            opponent: wizard1_addr,
        }, wizard2_addr);
    }

    public fun cast_spell(caster_cap: &mut DuelistCap) {
        let damage = SPELL_TEREBRARETE_DAMAGE;
        if (caster_cap.opponent_force <= damage) {
            caster_cap.opponent_force = 0;
        } else {
            caster_cap.opponent_force = caster_cap.opponent_force - damage;
        };
    }
} 