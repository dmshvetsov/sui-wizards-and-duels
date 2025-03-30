// must be the first import
const fs = require('fs');
const path = require('path');

const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { getFaucetHost, requestSuiFromFaucetV0 } = require('@mysten/sui/faucet');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Transaction } = require('@mysten/sui/transactions');
const WebSocket = require('ws');
const util = require('util');

function getPackageId() {
  const moveLockPath = path.join(__dirname, 'dapp', 'Move.lock');
  const moveLockContent = fs.readFileSync(moveLockPath, 'utf8');
  const latestPublishedIdMatch = moveLockContent.match(/latest-published-id = "([^"]+)"/);
  if (!latestPublishedIdMatch) {
    throw new Error('Could not find latest-published-id in Move.lock');
  }
  return latestPublishedIdMatch[1];
}

const DEBUG = process.env.DEBUG === 'true';

const PID = getPackageId();

const DUEL_STATES = {
  PENDING: 0,
  ACTION: 1,
  FINISHED: 2,
};

const DUEL_ERRORS = {
  INVALID_STATE: 0,
  INSUFFICIENT_FORCE: 1,
  NOT_WIZARD: 2,
};

const LOOP_STEP_MS = 1000;

function debugObject(obj, label = '') {
  if (!DEBUG) {
    return;
  }
  logObject(obj, label);
}

function logObject(obj, label = '') {
  console.log(label + util.inspect(obj, {
      depth: null,
      colors: true,
      maxArrayLength: null,
      maxStringLength: null,
      showHidden: true,
      compact: false,
      sorted: true,
      getters: true,
      showProxy: true,
    }));
}

// Initialize Sui client
// FIXME: try use websocket transport
const client = new SuiClient({ url: getFullnodeUrl('localnet') });

// Create two wizards with their keypairs
const wizard1Keypair = new Ed25519Keypair();
const wizard2Keypair = new Ed25519Keypair();

async function airdropSui(address) {
  console.log(`Requesting airdrop for address: ${address}`);
  return requestSuiFromFaucetV0({
    host: getFaucetHost('localnet'),
    recipient: address,
  });
}

async function setupWizards() {
  console.log('Setting up wizards...');
  const wizard1Address = wizard1Keypair.getPublicKey().toSuiAddress();
  const wizard2Address = wizard2Keypair.getPublicKey().toSuiAddress();

  console.log(`Wizard 1 address: ${wizard1Address}`);
  console.log(`Wizard 2 address: ${wizard2Address}`);

  await airdropSui(wizard1Address);
  await airdropSui(wizard2Address);
}

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

  debugObject(result, 'Transaction result: ');

  const createdObject = result.effects?.created?.[0];
  if (!createdObject) {
    throw new Error('Failed to create duel - no object was created');
  }
  const duelId = createdObject.reference.objectId;
  if (!duelId) {
    throw new Error('Failed to create duel - no object ID');
  }

  console.log(`Duel created with ID: ${duelId}`);
  return duelId;
}

async function startDuel(duelId) {
  console.log(`Starting ${duelId} duel...`);

  const tx = new Transaction();
  tx.moveCall({
    target: `${PID}::game::start_duel`,
    arguments: [tx.object(duelId)],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: wizard1Keypair,
    options: { showEffects: true },
  });

  debugObject(result, 'Start duel result: ');
}

async function castSpell(playerKeypair, duelId) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PID}::game::cast_spell`,
    arguments: [tx.object(duelId)],
  });

  try {
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: playerKeypair,
      options: { showEffects: true },
    });
    debugObject(result, 'Cast spell result: ');
  } catch (error) {
    // Extract error code from the error message
    const errorMatch = error.cause.executionErrorSource.match(/VMError with status ABORTED with sub status (\d+)/)
    if (errorMatch) {
      const errorCode = Number(errorMatch[1]);
      switch (errorCode) {
        case DUEL_ERRORS.INVALID_STATE:
          throw new Error('Cannot cast spell: duel is not in ACTION state');
        case DUEL_ERRORS.INSUFFICIENT_FORCE:
          console.log(`Wizard ${playerKeypair.getPublicKey().toSuiAddress()} does not have enough force`);
        case DUEL_ERRORS.NOT_WIZARD:
          throw new Error(`Cannot cast spell: ${playerKeypair.getPublicKey().toSuiAddress()} is not a participant in this duel`);
        default:
          // do nothung, the error will be rethrown later
      }
    }
    throw error;
  }
}

async function getDuel(duelId) {
  const duel = await client.getObject({
    id: duelId,
    options: { showContent: true },
  });

  debugObject(duel, 'Get duel state result: ');

  if (!duel.data?.content?.fields) {
    throw new Error('Failed to get duel state - no content fields');
  }

  return duel;
}

function getStateFromDuel(duel) {
  return Number(duel.data.content.fields.state);
}

function getWizardForcesFromDuel(duel) {
  const fields = duel.data.content.fields;
  return [
    Number(fields.wizard1.fields.force),
    Number(fields.wizard2.fields.force)
  ];
}

async function simulateDuel() {
  // Setup wizards with Sui coins
  await setupWizards();

  // Create duel
  const duelId = await createDuel();
  // FIXME: is there a better way to wait for the duel to be created?
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Start duel
  await startDuel(duelId);
  // FIXME: is there a better way to wait for the duel state to be updated? try WaitForEffectsCert requestType
  // or try https://sdk.mystenlabs.com/typescript/sui-client#waitfortransaction
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Duel loop
  while (true) {
    const duel = await getDuel(duelId);
    const state = getStateFromDuel(duel);
    const [force1, force2] = getWizardForcesFromDuel(duel);

    console.log('\nCurrent duel state:');
    console.log(`State: ${state}`);
    console.log(`Wizard 1 force: ${force1}`);
    console.log(`Wizard 2 force: ${force2}`);

    if (state === DUEL_STATES.FINISHED) {
      logObject(duel, 'Duel finished: ');
      break;
    }

    // Randomly decide if wizards cast spells
    // FIXME: must be called in parallel with Promise.allSettled and with random setTimeout for each spell cast. try WaitForEffectsCert requestType
    // or try https://sdk.mystenlabs.com/typescript/sui-client#waitfortransaction
    if (Math.random() < 0.45) {
      console.log('Wizard 1 casts spell!');
      await castSpell(wizard1Keypair, duelId);
    }
    if (Math.random() < 0.55) {
      console.log('Wizard 2 casts spell!');
      await castSpell(wizard2Keypair, duelId);
    }

    await new Promise((resolve) => setTimeout(resolve, LOOP_STEP_MS));
  }
}

// Start the duel simulation
simulateDuel().catch(logObject);