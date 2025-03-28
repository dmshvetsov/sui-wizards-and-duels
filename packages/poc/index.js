// must be the first import
require('dotenv').config();

const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
const { Ed25519Keypair } = require('@mysten/sui.js/cryptography');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const WebSocket = require('ws');

// Constants
const PID = process.env.PACKAGE_ID;
const DUEL_STATES = {
  PENDING: 0,
  ACTION: 1,
  FINISHED: 2,
};

// Initialize Sui client
const client = new SuiClient({ url: getFullnodeUrl('devnet') });

// Create two wizards with their keypairs
const wizard1Keypair = Ed25519Keypair.generate();
const wizard2Keypair = Ed25519Keypair.generate();

// Duel state
let duelId = null;

async function createDuel() {
  console.log('Creating duel...');

  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${PID}::game::create_duel`,
    arguments: [
      tx.pure(wizard1Keypair.getPublicKey().toSuiAddress()),
      tx.pure(wizard2Keypair.getPublicKey().toSuiAddress())
    ],
  });

  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: wizard1Keypair,
    options: { showEffects: true },
  });

  duelId = result.effects.created[0].objectId;
  console.log(`Duel created with ID: ${duelId}`);
}

async function startDuel() {
  console.log('Starting duel...');

  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${PID}::game::start_duel`,
    arguments: [tx.object(duelId)],
  });

  await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: wizard1Keypair,
    options: { showEffects: true },
  });
}

async function castSpell(playerKeypair) {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${PID}::game::cast_spell`,
    arguments: [tx.object(duelId)],
  });

  await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: playerKeypair,
    options: { showEffects: true },
  });
}

async function getDuelState() {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${PID}::game::get_duel_state`,
    arguments: [tx.object(duelId)],
  });

  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: wizard1Keypair,
    options: { showEffects: true },
  });

  return result.effects.returnValues[0];
}

async function getWizardForces() {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${PID}::game::get_wizard_forces`,
    arguments: [tx.object(duelId)],
  });

  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: wizard1Keypair,
    options: { showEffects: true },
  });

  return result.effects.returnValues[0];
}

async function simulateDuel() {
  try {
    // Create duel
    await createDuel();
    
    // Start duel
    await startDuel();
    
    // Duel loop
    while (true) {
      const state = await getDuelState();
      const [force1, force2] = await getWizardForces();
      
      console.log('\nCurrent duel state:');
      console.log(`Wizard 1 force: ${force1}`);
      console.log(`Wizard 2 force: ${force2}`);
      
      if (state === DUEL_STATES.FINISHED) {
        console.log('\nDuel finished!');
        break;
      }
      
      // Randomly decide if wizards cast spells
      if (Math.random() < 0.5) {
        console.log('Wizard 1 casts spell!');
        await castSpell(wizard1Keypair);
      }
      
      if (Math.random() < 0.5) {
        console.log('Wizard 2 casts spell!');
        await castSpell(wizard2Keypair);
      }
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Error during duel:', error);
  }
}

// Start the duel simulation
simulateDuel().catch(console.error);
