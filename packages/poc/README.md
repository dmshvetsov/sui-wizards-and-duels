# Semi-Real time or Real time typing duel game, Proof of Concept

Simplest implementation of the idea to test if Sui blockchain and its infrastructure like RPC and existing connections are campable to provide great game experience.

Use a script that simulates a game of two players that use set of predefined spells in form of words to win a duel. The script must:
* connect to Sui RPC free local network using WebSockets 
* initiate a duel state, duel state must be stored on Sui blockchain using the game dApp deployed to Sui local network, state consisto of
    * state machine field has enum value with linear transition from "pending" to "action" to "finished"
    * each player has force measured in u16 number or similar
* start the duel
* read current state in each loop of the duel
* send transactions to Sui blockchain to update the duel state
    * there are different types of spell that can improve the player abilities, defend from attacking spells of an opponent, or attack opponent with intent to cause a damage to win a duel
    * in the script only one attacking spell "terebrarete" is implemented
    * to cast spell player need to spend force, if a player has not enough force he unable to cast spell
    * an attacking spell will cause damage to an opponent player force
* run game/duel loop
* in each loop the script randomly decide if each player sends or not an attacking "terebrarete" spell
* keep duel loop until one player won't cause enough damage to an opponent to wint the duel
* finish the duel
* print the duel state to the console

The goal of this script is to find how fast players (bot that acts as two players) can send spells in other words transactions to the blockchain and have a great player experience.

## how to run

in a first terminal session

    $ pnpm run setup

    $ pnpm run start

put deployed program address as PROGRAM_ID env variable to `.env` file inside POC root folder

in a second terminall session

    $ pnpm run test

## results

### Duel as a shared object

when a duel is a shared object the duel usually ends within below conditions

Total iterations: 8
Min time spent: 1615ms
Max time spent: 1860ms
Mean time spent: 1765.25ms
P50 time spent: 1806ms
P90 time spent: 1860ms
P95 time spent: 1860ms

tested from easter europe against Sui devnet

### Without Duel shared object, with DuelistCap

Total iterations: 13
Min time spent: 1ms
Max time spent: 1768ms
Mean time spent: 1462.38ms
P50 time spent: 1586ms
P90 time spent: 1655ms
P95 time spent: 1768ms