#!/usr/bin/env node
/**
 * Grants (or removes) the `admin` custom claim, which firestore.rules require
 * for writing subjectFields / subjects / questions from a client.
 * Not needed for the seed script itself (the Admin SDK bypasses rules).
 *
 *   node set-admin.mjs --project <projectId> lecturer@example.com          grant
 *   node set-admin.mjs --project <projectId> lecturer@example.com --remove revoke
 *
 * The user must sign out and in again for the claim to take effect.
 */
const args = process.argv.slice(2);
const i = args.indexOf('--project');
const projectId = i >= 0 ? args[i + 1] : process.env.GCLOUD_PROJECT;
const email = args.find((a, idx) => !a.startsWith('--') && args[idx - 1] !== '--project');
const remove = args.includes('--remove');

if (!projectId || !email) {
  console.error('Usage: node set-admin.mjs --project <projectId> <email> [--remove]');
  process.exit(1);
}

const { initializeApp, applicationDefault } = await import('firebase-admin/app');
const { getAuth } = await import('firebase-admin/auth');
initializeApp({ credential: applicationDefault(), projectId });

const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: !remove });
console.log(`${remove ? 'Removed' : 'Granted'} admin for ${email} (${user.uid}). Ask them to log out and back in.`);
