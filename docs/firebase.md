# EduTask — Firebase setup

EduTask is a client-only app: **React Native (Expo) → Firebase Authentication → Cloud Firestore**. There is no backend server and no mock data. Until the Firebase config is added the app shows a "Connect Firebase" screen listing exactly which values are missing.

## Setup checklist

You need: a Google account, Node 18+, and the Firebase CLI (`npm i -g firebase-tools`, then `firebase login`).

1. **Create a Firebase project** — <https://console.firebase.google.com> → *Add project*. Google Analytics is optional.
2. **Enable Authentication** — *Build → Authentication → Get started*.
3. **Enable the Email/Password provider** — *Sign-in method → Email/Password → Enable* (leave "Email link" off).
4. **Create the Firestore database** — *Build → Firestore Database → Create database*, **production mode**, pick a region close to your users (e.g. `asia-southeast1`). The region can't be changed later.
5. **Firebase Storage** — *skip*. EduTask doesn't upload files. (`storage.rules` is a deny-all placeholder for later.)
6. **Register a Web app** — *Project settings → General → Your apps → Web (`</>`)*. No hosting needed. Copy the `firebaseConfig` values. (Use the *Web* app, not Android/iOS — Expo Go uses the Firebase JS SDK.)
7. **Configure Expo env variables** — in the project folder: `cp .env.example .env` and fill in:

   | `.env` variable | `firebaseConfig` key |
   | --- | --- |
   | `EXPO_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
   | `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
   | `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `EXPO_PUBLIC_FIREBASE_APP_ID` | `appId` |

   These are public identifiers, not secrets — security comes from the Firestore rules. `.env` is git-ignored anyway.
8. **Deploy the security rules** — `cp .firebaserc.example .firebaserc`, put your project ID in it, then `firebase deploy --only firestore:rules`.
9. **Deploy the indexes** — `firebase deploy --only firestore:indexes`. Index builds take a few minutes; until they finish, the task list and quiz history show "The database is missing a required index".
10–12. **Add subject fields, subjects and questions** — run the seed tool (admin only, on your computer):

    ```bash
    cd tools/firestore-seed
    npm install
    npm run validate                      # checks data/ — no credentials needed
    # Firebase console → Project settings → Service accounts → Generate new private key
    # Save it OUTSIDE the repo, e.g. ~/keys/edutask-admin.json
    export GOOGLE_APPLICATION_CREDENTIALS=~/keys/edutask-admin.json
    npm run seed -- --project <your-project-id>
    ```

    This writes the 7 fields, 28 subjects and the starter question bank. Re-running is safe (documents have fixed IDs). Use `--prune` to also delete questions you removed from `data/`.
13. **Run the app** — `npx expo start -c` (the `-c` clears the cache so the new env values are picked up), scan the QR code with Expo Go, register an account.

## Data model

```
users/{uid}                          uid, displayName, email, createdAt, updatedAt
users/{uid}/quizSessions/{id}        unfinished quiz: subjectId, subjectName, subjectCode, level,
                                     questionIds[10], answers{questionId: option}, checked[], currentIndex,
                                     remainingSeconds, resultId, startedAt, updatedAt
subjectFields/{fieldId}              name, description, icon, order
subjects/{subjectId}                 fieldId, code, name, description, order, isActive
questions/{questionId}               subjectId, level (1–15), question, options[], correctAnswer,
                                     explanation, order, isActive
quizResults/{resultId}               userId, subjectId, subjectName, subjectCode, level, totalQuestions,
                                     correctAnswers, incorrectAnswers, score, percentage, durationSeconds,
                                     answers[{questionId, question, selectedAnswer, correctAnswer, isCorrect}],
                                     completedAt
tasks/{taskId}                       userId, title, description, subjectId, dueDate, priority,
                                     status, completedAt, createdAt, updatedAt
```

Notes on the few additions to the brief's model:

- `quizResults` also stores `subjectName`, `subjectCode`, `durationSeconds` and the graded `answers`, so history and the review screen stay correct even if questions are edited later, with no extra reads.
- `users/{uid}/quizSessions` powers **Continue quiz**: progress is saved as you answer, and deleted in the same atomic batch that writes the result.
- `tasks.completedAt` is `null` while pending.

All timestamps are set with `serverTimestamp()`, and the rules require `== request.time`, so clients can't backdate anything.

## Security rules (`firestore.rules`)

- Users can only read and write **their own** `users/{uid}`, `tasks`, `quizResults` and `quizSessions`. The owner is always `request.auth.uid`; a `userId` sent by the client must equal it.
- Tasks: field types, title/description lengths, priority and status values are validated. `userId` and `createdAt` can't change.
- Quiz results: create-only (no edits or deletes). The rules check that the subject exists, the level is 1–15, there are exactly 10 questions, `incorrect = 10 − correct`, `score = correct` and `percentage = correct × 10`.
- `subjectFields`, `subjects` and `questions` are **read-only** for students. Writes require the custom claim `admin: true` (`tools/firestore-seed/set-admin.mjs`). The seed tool itself uses the Admin SDK, which bypasses rules.
- There is no `allow ... if true` anywhere; anything not matched is denied.

**Known limitation:** grading happens on the device. The rules make results internally consistent and owned by the right user, but a determined student with dev tools could still submit a fake 10/10, and students can read `correctAnswer` because the app needs it for instant feedback. Fully tamper-proof scoring needs server-side grading (a Cloud Function, Blaze plan) with answers stored where students can't read them. That's a reasonable future step, not something the brief asked for.

## Indexes (`firestore.indexes.json`)

| Collection | Fields | Used by |
| --- | --- | --- |
| `tasks` | `userId` ↑, `dueDate` ↑ | real-time task list |
| `quizResults` | `userId` ↑, `completedAt` ↓ | quiz history (Home, Quiz, Profile, History) |
| `questions` | `subjectId` ↑, `level` ↑, `isActive` ↑ | loading a level's questions |
| `subjects` | `fieldId` ↑, `isActive` ↑ | subjects in a field |

`subjectFields` (ordered by `order`) and the all-subjects query use automatic single-field indexes.

## Offline behaviour

Firestore's persistent cache uses IndexedDB, which React Native doesn't have, so the app uses the **memory cache**:

- Listeners keep working, and local edits appear instantly. They're marked **"Not synced yet"** until the server confirms them.
- Every write the user waits on (register, add/edit/complete/delete task, submit quiz) has a 15-second timeout. If the server doesn't confirm in time, the app says the change **hasn't been confirmed as saved**. It never shows success for an unconfirmed write.
- Retrying is safe. New tasks and quiz results use IDs generated when the form or quiz opens, and a retry first checks the server, so a timeout followed by "try again" can't create duplicates.
- A global banner shows when the device is offline (NetInfo, included in Expo Go).

## Adding questions

Add files to `tools/firestore-seed/data/questions/` and re-run the seed:

- **JSON** (one file per subject):
  `{ "subjectId": "...", "levels": { "5": [ { "question", "options", "correctAnswer", "explanation" } ] } }`
- **CSV** (works well with Excel or Google Sheets): copy `_template.csv`. Columns: `subjectId, level, question, option1…option4 (up to option6), correctAnswer, explanation, isActive`.

`correctAnswer` must match one option exactly. Each level needs **at least 10 active questions**; with fewer, the app shows "Not enough questions are available for this level yet" and doesn't start the quiz. Adding more than 10 is encouraged, because each attempt picks a random 10.
