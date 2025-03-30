///  dapp to make proof of concept of the simplest implementation of a magic duel game
///  NOTE: this smart contract were build without considering the best practices of on-chain programming, including security
///  the sole purpose is to test a concept of using blockchain as a backend for a game
module magic_duel::game {
    use sui::event;
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    const SPELL_TEREBRARETE_COST: u16 = 10;
    const SPELL_TEREBRARETE_DAMAGE: u16 = 14;
    const WIZARD_FORCE: u16 = 128;

    /// Duel state enum
    const STATE_PENDING: u8 = 0;
    const STATE_ACTION: u8 = 1;
    const STATE_FINISHED: u8 = 2;

    /// Error codes
    const EInvalidState: u64 = 0;
    const EInsufficientForce: u64 = 1;
    const ENotWizard: u64 = 2;

    /// Represents a wizard in the duel
    struct Wizard has store, copy, drop {
        force: u16,
        address: address,
    }

    /// Represents the duel state
    struct Duel has key {
        id: UID,
        state: u8,
        wizard1: Wizard,
        wizard2: Wizard,
    }

    //
    // Events
    // 
  
    struct DuelStarted has copy, drop {
        duel_id: ID,
        wizard1: address,
        wizard2: address,
    }

    struct SpellCast has copy, drop {
        duel_id: ID,
        caster: address,
        spell: vector<u8>,
        damage: u16,
    }

    struct DuelFinished has copy, drop {
        duel_id: ID,
        winner: address,
    }

    public fun create_duel(
        wizard1_addr: address,
        wizard2_addr: address,
        ctx: &mut TxContext
    ) {
        let duel = Duel {
            id: object::new(ctx),
            state: STATE_PENDING,
            wizard1: Wizard { force: WIZARD_FORCE, address: wizard1_addr },
            wizard2: Wizard { force: WIZARD_FORCE, address: wizard2_addr },
        };
        transfer::share_object(duel);
    }

    public fun start_duel(duel: &mut Duel, ctx: &mut TxContext) {
        assert!(duel.state == STATE_PENDING, EInvalidState);

        let sender = tx_context::sender(ctx);
        assert!(sender == duel.wizard1.address || sender == duel.wizard2.address, ENotWizard);

        duel.state = STATE_ACTION;
        
        event::emit(DuelStarted {
            duel_id: object::id(duel),
            wizard1: duel.wizard1.address,
            wizard2: duel.wizard2.address,
        });
    }

    public fun cast_spell(duel: &mut Duel, ctx: &mut TxContext) {
        assert!(duel.state == STATE_ACTION, EInvalidState);
        
        let sender = tx_context::sender(ctx);
        assert!(sender == duel.wizard1.address || sender == duel.wizard2.address, ENotWizard);

        let duel_id = object::id(duel);
        let (caster, opponent) = if (sender == duel.wizard1.address) {
            (&mut duel.wizard1, &mut duel.wizard2)
        } else {
            (&mut duel.wizard2, &mut duel.wizard1)
        };

        assert!(caster.force >= SPELL_TEREBRARETE_COST, EInsufficientForce);
        caster.force = caster.force - SPELL_TEREBRARETE_COST;

        let damage = SPELL_TEREBRARETE_DAMAGE;
        if (opponent.force <= damage) {
            opponent.force = 0;
            duel.state = STATE_FINISHED;
        } else {
            opponent.force = opponent.force - damage;
        };
        let caster_address = caster.address;
        event::emit(SpellCast {
            duel_id,
            caster: caster_address,
            spell: b"terebrarete",
            damage
        });
        if (opponent.force == 0) {
            event::emit(DuelFinished {
                duel_id,
                winner: caster_address,
            });
        }
    }
} 