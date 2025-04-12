/**
 * A throw away script to make a proof of concept for a real time or almost real time game with Sui blockchain as a backend.
 * author: Dmitry Shvtsov @dmshvetsov with help of Claude Sonnet AI
 */

// must be the first import
const fs = require('fs');
const path = require('path');

const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Transaction, Inputs } = require('@mysten/sui/transactions');
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

if (!process.env.PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const PID = getPackageId();
const funderKeypair = Ed25519Keypair.fromSecretKey(process.env.PRIVATE_KEY);

const DUEL_ERRORS = {
  INVALID_STATE: 0,
  INSUFFICIENT_FORCE: 1,
  NOT_WIZARD: 2,
};

const LOOP_STEP_MS = 300;
const SPELL_TEREBRARETE_DAMAGE = 14;

function debugObject(obj, label = '') {
  if (!DEBUG) {
    return;
  }
  logObject(obj, label);
}

function logObject(obj, label = '') {
  console.log(
    label +
      util.inspect(obj, {
        depth: null,
        colors: true,
        maxArrayLength: null,
        maxStringLength: null,
        showHidden: true,
        compact: false,
        sorted: true,
        getters: true,
        showProxy: true,
      })
  );
}

// Initialize Sui client
// const client = new SuiClient({ url: process.env.RPC_URL });
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// Create two wizards with their key pairs
const wizard1Keypair = new Ed25519Keypair();
const wizard2Keypair = new Ed25519Keypair();

async function fundWizard(address, amount) {
  console.log(`Funding wizard at address: ${address} with ${amount} MIST`);
  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
  tx.transferObjects([coin], tx.pure.address(address));
  tx.setGasBudget(3_500_000);
  tx.setGasPrice(1_000);

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: funderKeypair,
    options: { showEffects: true },
  });

  debugObject(result, 'Fund wizard result: ');
  await client.waitForTransaction({
    digest: result.digest,
  });
}

async function startDuel() {
  console.log(`Starting duel...`);

  const tx = new Transaction();
  tx.moveCall({
    target: `${PID}::game::create_duel`,
    arguments: [
      tx.pure.address(wizard1Keypair.getPublicKey().toSuiAddress()),
      tx.pure.address(wizard2Keypair.getPublicKey().toSuiAddress()),
    ],
  });
  tx.setGasBudget(6_000_000);
  tx.setGasPrice(1_000);

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: wizard1Keypair,
    options: { showEffects: true },
  });

  await client.waitForTransaction({
    digest: result.digest,
  });

  debugObject(result, 'Start duel result: ');

  // Get duelist caps created during start_duel
  const cap1 = result.effects?.created?.[0];
  const cap2 = result.effects?.created?.[1];
  if (!cap1 || !cap2) {
    throw new Error('Failed to start duel - no duelist caps were created');
  }
  if (cap1.owner.AddressOwner === wizard1Keypair.getPublicKey().toSuiAddress()) {
    return { duelistCap1Id: cap1.reference.objectId, duelistCap2Id: cap2.reference.objectId };
  } else {
    return { duelistCap1Id: cap2.reference.objectId, duelistCap2Id: cap1.reference.objectId };
  }
}

async function castSpell(playerKeypair, duelistCap) {
  const tx = new Transaction();
  // NOTE: optimization #1, must provide object reference with digest and version to remove an RPC call to getObject
  // this must speed up the game and reduce PRC cost
  const duelistCapObjRef = tx.object(
    Inputs.ObjectRef({
      digest: duelistCap.digest,
      objectId: duelistCap.objectId,
      version: duelistCap.version,
    })
  );
  debugObject(duelistCap, 'Duelist state before tx: ');
  tx.moveCall({
    target: `${PID}::game::cast_spell`,
    arguments: [duelistCapObjRef],
  });
  // NOTE: optimization #2, must set gas limit explicitly otherwise client will make a dryRunTransactionBlock to an RPC
  // this must speed up the game and reduce PRC cost
  tx.setGasBudget(1_500_000);
  // NOTE: optimization #3, must set gas price otherwise client will make a getReferenceGasPrice to an RPC
  // this must speed up the game and reduce PRC cost
  tx.setGasPrice(1_000);
  // NOTE: yet another optimization is possible if i know the gas payment object reference (objectId, version, digest)

  try {
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: playerKeypair,
      options: { showEffects: true },
    });
    debugObject(result, 'Cast spell result: ');
    const mutated = result?.effects?.mutated.find(obj => obj.reference.objectId === duelistCap.objectId);
    if (!mutated) {
      throw new Error('unable to find duelistCap mutated effect');
    }

    return {
      ...duelistCap,
      // version: String(BigInt(duelistCap.version) + 1n),
      digest: mutated.reference.digest,
      version: mutated.reference.version,
      content: {
        ...duelistCap.content,
        fields: {
          ...duelistCap.content.fields,
          opponent_force: Math.max(0, duelistCap.content.fields.opponent_force - SPELL_TEREBRARETE_DAMAGE),
        },
      },
    };
  } catch (error) {
    // Extract error code from the error message
    const errorMatch = error.cause?.executionErrorSource?.match(
      /VMError with status ABORTED with sub status (\d+)/
    );
    if (errorMatch) {
      const errorCode = Number(errorMatch[1]);
      switch (errorCode) {
        case DUEL_ERRORS.INVALID_STATE:
          throw new Error('Cannot cast spell: duel is not in ACTION state');
        case DUEL_ERRORS.INSUFFICIENT_FORCE:
          console.log(
            `Wizard ${playerKeypair.getPublicKey().toSuiAddress()} does not have enough force`
          );
          break;
        case DUEL_ERRORS.NOT_WIZARD:
          throw new Error(
            `Cannot cast spell: ${playerKeypair.getPublicKey().toSuiAddress()} is not a participant in this duel`
          );
        default:
          // unknown error, rethrow
          throw error;
      }
    } else {
      // not an on-chain program error, rethrow
      throw error;
    }
  }
}

async function getDuelistCap(duelistCapId) {
  const now = Date.now();
  const duelistCap = await client.getObject({
    id: duelistCapId,
    options: { showContent: true },
  });
  console.log(`Get duelist cap time: ${Date.now() - now}ms`);

  debugObject(duelistCap, 'Get duelist cap result: ');

  if (!duelistCap.data?.content?.fields) {
    throw new Error('Failed to get duelist cap state - no content fields');
  }

  return duelistCap.data;
}

function getOpponentForce(duelistCap) {
  const fields = duelistCap.content.fields;
  return Number(fields.opponent_force);
}

function logStatistics(spentTimes) {
  // Calculate basic statistics
  const minSpent = Math.min(...spentTimes);
  const maxSpent = Math.max(...spentTimes);
  const meanSpent = spentTimes.reduce((a, b) => a + b, 0) / spentTimes.length;

  // Calculate percentiles
  const sortedTimes = [...spentTimes].sort((a, b) => a - b);
  const p50Index = Math.floor(sortedTimes.length * 0.5);
  const p90Index = Math.floor(sortedTimes.length * 0.9);
  const p95Index = Math.floor(sortedTimes.length * 0.95);

  console.log('\nLoop Statistics:');
  console.log(`Total iterations: ${spentTimes.length}`);
  console.log(`Min time spent: ${minSpent}ms`);
  console.log(`Max time spent: ${maxSpent}ms`);
  console.log(`Mean time spent: ${meanSpent.toFixed(2)}ms`);
  console.log(`P50 time spent: ${sortedTimes[p50Index]}ms`);
  console.log(`P90 time spent: ${sortedTimes[p90Index]}ms`);
  console.log(`P95 time spent: ${sortedTimes[p95Index]}ms`);
}

async function simulateDuel() {
  console.log('Setting up wizards...');
  const wizard1Address = wizard1Keypair.getPublicKey().toSuiAddress();
  const wizard2Address = wizard2Keypair.getPublicKey().toSuiAddress();

  console.log(`Wizard 1 address: ${wizard1Address}`);
  console.log(`Wizard 2 address: ${wizard2Address}`);

  // Fund each wizard with 0.025 SUI
  await fundWizard(wizard1Address, 20000000);
  await new Promise((resolve) => setTimeout(resolve, 2500));
  await fundWizard(wizard2Address, 16000000);
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const { duelistCap1Id, duelistCap2Id } = await startDuel();
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Statistics for loop iterations
  const spentCastSpellTimes = [];

  let duelistCap1 = await getDuelistCap(duelistCap1Id);
  let duelistCap2 = await getDuelistCap(duelistCap2Id);

  // Duel loop
  while (true) {
    // Get forces from duelist caps
    const force2 = getOpponentForce(duelistCap1);
    const force1 = getOpponentForce(duelistCap2);

    console.log(`Wizard 1 force: ${force1}`);
    console.log(`Wizard 2 force: ${force2}`);

    if (force1 <= 0 || force2 <= 0) {
      const duelistCap1end = await getDuelistCap(duelistCap1Id);
      const duelistCap2end = await getDuelistCap(duelistCap2Id);
      console.log('Duel finished')
      logObject(duelistCap1end);
      logObject(duelistCap2end);
      break;
    }

    // Cast spells in parallel with random timeouts
    const spellPromises = [];
    let nowTs = Date.now();

    if (Math.random() < 0.45) {
      const timeout = Math.floor(Math.random() * 250);
      spellPromises.push(
        new Promise((resolve) => setTimeout(resolve, timeout))
          .then(() => {
            console.log('Wizard 1 casts spell!');
            return castSpell(wizard1Keypair, duelistCap1);
          })
          .then((upd) => {
            duelistCap1 = upd;
          })
          .catch((error) => {
            console.error('Wizard 1 spell failed:', error);
            return null;
          })
      );
    }

    if (Math.random() < 0.55) {
      const timeout = Math.floor(Math.random() * 250);
      spellPromises.push(
        new Promise((resolve) => setTimeout(resolve, timeout))
          .then(() => {
            console.log('Wizard 2 casts spell!');
            return castSpell(wizard2Keypair, duelistCap2);
          })
          .then((upd) => {
            duelistCap2 = upd;
          })
          .catch((error) => {
            console.error('Wizard 2 spell failed:', error);
            return null;
          })
      );
    }

    // Wait for all spell casts to complete
    if (spellPromises.length > 0) {
      await Promise.allSettled(spellPromises);
    }

    // Wait for the remaining time after the longest spell cast
    const spentTs = Date.now() - nowTs;
    const remainingTime = Math.max(0, LOOP_STEP_MS - spentTs);
    console.log(
      `=== cast spells took ${spentTs}ms, waiting for ${remainingTime}ms before next loop`
    );

    // Collect statistics
    if (spentTs > 0) {
      spentCastSpellTimes.push(spentTs);
    }

    if (remainingTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
    }
  }

  // Log statistics
  logStatistics(spentCastSpellTimes);
}

// Start the duel simulation
simulateDuel().catch(logObject);
