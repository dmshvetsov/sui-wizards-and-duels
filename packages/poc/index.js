// must be the first import
require('dotenv').config();

const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Transaction } = require('@mysten/sui/transactions');
const WebSocket = require('ws');

// Constants
const PID = process.env.PACKAGE_ID;
const DUEL_STATES = {
  PENDING: 0,
  ACTION: 1,
  FINISHED: 2,
};
const LOOP_STEP_MS = 1000;

// Initialize Sui client
const client = new SuiClient({ url: getFullnodeUrl('localnet') });

// Create two wizards with their keypairs
const wizard1Keypair = new Ed25519Keypair();
const wizard2Keypair = new Ed25519Keypair();

// Duel state
let duelId = null;

async function createDuel() {
  console.log('Creating duel...');

  const tx = new Transaction();
  tx.moveCall({
    target: `${PID}::game::create_duel`,
    arguments: [
      tx.pure.address(wizard1Keypair.getPublicKey().toSuiAddress()),
      tx.pure.address(wizard2Keypair.getPublicKey().toSuiAddress()),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: wizard1Keypair,
    options: { showEffects: true },
  });

  const createdObject = result.effects?.created?.[0];
  if (!createdObject) {
    throw new Error('Failed to create duel - no object was created');
  }
  duelId = createdObject.objectId;
  console.log(`Duel created with ID: ${duelId}`);
}

async function startDuel() {
  console.log('Starting duel...');

  const tx = new Transaction();
  tx.moveCall({
    target: `${PID}::game::start_duel`,
    arguments: [tx.object(duelId)],
  });

  await client.signAndExecuteTransaction({
    transaction: tx,
    signer: wizard1Keypair,
    options: { showEffects: true },
  });
}

async function castSpell(playerKeypair) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PID}::game::cast_spell`,
    arguments: [tx.object(duelId)],
  });

  await client.signAndExecuteTransaction({
    transaction: tx,
    signer: playerKeypair,
    options: { showEffects: true },
  });
}

async function getDuelState() {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PID}::game::get_duel_state`,
    arguments: [tx.object(duelId)],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: wizard1Keypair,
    options: { showEffects: true },
  });

  const returnValue = result.effects?.returnValues?.[0];
  if (!returnValue) {
    throw new Error('Failed to get duel state - no return value');
  }
  return Number(returnValue);
}

async function getWizardForces() {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PID}::game::get_wizard_forces`,
    arguments: [tx.object(duelId)],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: wizard1Keypair,
    options: { showEffects: true },
  });

  const returnValue = result.effects?.returnValues?.[0];
  if (!returnValue) {
    throw new Error('Failed to get wizard forces - no return value');
  }
  return returnValue.map(Number);
}

async function simulateDuel() {
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
    if (Math.random() < 0.45) {
      console.log('Wizard 1 casts spell!');
      await castSpell(wizard1Keypair);
    }
    if (Math.random() < 0.55) {
      console.log('Wizard 2 casts spell!');
      await castSpell(wizard2Keypair);
    }

    await new Promise((resolve) => setTimeout(resolve, LOOP_STEP_MS));
  }
}

// Start the duel simulation
simulateDuel().catch(console.error);
