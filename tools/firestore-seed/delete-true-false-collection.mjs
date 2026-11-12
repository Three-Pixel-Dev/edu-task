#!/usr/bin/env node
/**
 * Deletes every document in Firestore collection `trueFalseQuestions`.
 * Use after moving Quiz (True / False) content into the app bundle.
 *
 *   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
 *   node delete-true-false-collection.mjs --project <your-project-id>
 *
 * Batches of 200 with a short pause to stay within free-tier write/delete limits.
 */
import { readFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const projectId = option('--project') ?? process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
const COLLECTION = 'trueFalseQuestions';
const BATCH = 200;
const PAUSE_MS = 800;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!projectId) {
    console.error('Pass --project <firebase-project-id>');
    process.exit(1);
  }

  const { initializeApp, applicationDefault, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  let credential = applicationDefault();
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? 'D:\\edutask-admin.json';
  try {
    credential = cert(JSON.parse(await readFile(keyPath, 'utf8')));
    console.log(`Using service account: ${keyPath}`);
  } catch {
    console.log('Using application default credentials');
  }

  initializeApp({ credential, projectId });
  const db = getFirestore();
  console.log(`Deleting ${COLLECTION} from project "${projectId}"…`);

  let total = 0;
  for (;;) {
    const snap = await db.collection(COLLECTION).limit(BATCH).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    total += snap.size;
    console.log(`  deleted ${total}…`);
    await sleep(PAUSE_MS);
  }

  console.log(`\n✓ Removed ${total} document(s) from ${COLLECTION}.`);
  console.log('True/False quizzes now load from src/data/true-false/*.json in the app.');
}

main().catch((error) => {
  console.error('\n✖ Delete failed:', error.message ?? error);
  process.exit(1);
});
