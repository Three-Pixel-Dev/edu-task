#!/usr/bin/env node
/**
 * EduTask content seed — writes subjectFields, subjects and questions to
 * Firestore with the Firebase Admin SDK.
 *
 * This is an ADMIN tool. It runs on your computer, never inside the mobile
 * app, and needs a service-account key that must never be committed or put in
 * an EXPO_PUBLIC_ variable.
 *
 *   node seed.mjs --dry-run                   validate data/ only (no credentials needed)
 *   node seed.mjs --project <projectId>       validate, then write
 *   node seed.mjs --project <id> --prune      also delete questions that were removed from data/
 *
 * Credentials: set GOOGLE_APPLICATION_CREDENTIALS to the service-account JSON
 * path (Firebase console → Project settings → Service accounts → Generate new
 * private key), or run `gcloud auth application-default login`.
 * Against the emulator: FIRESTORE_EMULATOR_HOST=localhost:8080 node seed.mjs --project demo-edutask
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSeedData } from './lib/load.mjs';
import { coverage, QUESTIONS_PER_QUIZ, validateSeed } from './lib/validate.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const dryRun = flag('--dry-run');
const prune = flag('--prune');
const dataDir = path.resolve(option('--data') ?? path.join(here, 'data'));

async function knownFeatherIcons() {
  // Optional: validate icon names against the app's icon set when it's installed.
  const glyphs = path.resolve(here, '../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Feather.json');
  try {
    return new Set(Object.keys(JSON.parse(await readFile(glyphs, 'utf8'))));
  } catch {
    return null;
  }
}

function printCoverage(data) {
  console.log('\nQuestion coverage (levels with ≥ 10 active questions are playable):');
  for (const { subject, levels, playable } of coverage(data)) {
    const detail = levels
      .filter((l) => l.count > 0)
      .map((l) => `L${l.level}:${l.count}${l.count < QUESTIONS_PER_QUIZ ? '!' : ''}`)
      .join(' ');
    console.log(`  ${subject.code.padEnd(10)} ${subject.name.padEnd(34)} ${String(playable).padStart(2)}/15 playable  ${detail}`);
  }
  console.log('  (! = fewer than 10 questions — the app shows "Not enough questions" for that level)');
}

async function main() {
  const data = await loadSeedData(dataDir);
  const problems = validateSeed(data, await knownFeatherIcons());

  console.log(`Loaded ${data.subjectFields.length} fields, ${data.subjects.length} subjects, ${data.questions.length} questions from ${dataDir}`);
  if (problems.length) {
    console.error(`\n✖ ${problems.length} problem(s) found — nothing was written:\n`);
    problems.forEach((p) => console.error(`  • ${p}`));
    process.exit(1);
  }
  console.log('✓ Data is valid.');
  printCoverage(data);

  if (dryRun) {
    console.log('\nDry run — nothing was written.');
    return;
  }

  const projectId = option('--project') ?? process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    console.error('\nPass --project <your-firebase-project-id> (or use --dry-run).');
    process.exit(1);
  }

  // Imported only when writing, so --dry-run works without installing anything.
  const { initializeApp, applicationDefault } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  const emulator = process.env.FIRESTORE_EMULATOR_HOST;
  initializeApp(emulator ? { projectId } : { credential: applicationDefault(), projectId });
  const db = getFirestore();
  console.log(`\nWriting to project "${projectId}"${emulator ? ` (emulator ${emulator})` : ''}…`);

  const writes = [
    ...data.subjectFields.map(({ id, ...rest }) => ({ ref: db.collection('subjectFields').doc(id), data: rest })),
    ...data.subjects.map(({ id, ...rest }) => ({ ref: db.collection('subjects').doc(id), data: rest })),
    ...data.questions.map(({ id, data: q }) => ({ ref: db.collection('questions').doc(id), data: q })),
  ];

  for (let i = 0; i < writes.length; i += 400) {
    const batch = db.batch();
    writes.slice(i, i + 400).forEach((w) => batch.set(w.ref, w.data));
    await batch.commit();
    console.log(`  committed ${Math.min(i + 400, writes.length)}/${writes.length}`);
  }

  if (prune) {
    const keep = new Set(data.questions.map((q) => q.id));
    const seededSubjects = new Set(data.questions.map((q) => q.data.subjectId));
    let removed = 0;
    for (const subjectId of seededSubjects) {
      const snap = await db.collection('questions').where('subjectId', '==', subjectId).get();
      const stale = snap.docs.filter((d) => !keep.has(d.id));
      for (let i = 0; i < stale.length; i += 400) {
        const batch = db.batch();
        stale.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      removed += stale.length;
    }
    console.log(`  pruned ${removed} question(s) no longer in data/`);
  }

  console.log('\n✓ Seed complete.');
}

main().catch((error) => {
  console.error('\n✖ Seed failed:', error.message ?? error);
  process.exit(1);
});
