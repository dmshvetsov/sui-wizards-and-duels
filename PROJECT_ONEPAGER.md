# Project Documentation

WIP

## Sui Transaction Life cycle

A transaction certificate does not always guaranteed finality, even though it's highly likely. Specifically, a transaction certificate might become void after an epoch change.

An effects certificate guarantees finality - it takes a super majority of validators to execute the transaction and commit to the effects.

An inclusion in a certified checkpoint guarantees finality - it takes a super majority of validators to certify the checkpoint, in which every transaction is executed and effects-committed.

Source https://docs.sui.io/concepts/sui-architecture/transaction-life cycle

## Game optimizations for real-time effect

### Optimistic changes in UI

### Game Design for Lose Dependency on Current Game State Right in the Moment

### Use Web2 Technologies When High Fidelity in Current Game State is Required

Considerations:

- gRPC
- Edge function, connections to closest Sui RPC providers per users location, grouping player by location
- web sockets
- peer to peer messages/events between players
