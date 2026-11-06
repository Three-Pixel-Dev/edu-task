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
    npm run sync:true-false               # copies data/true-false/ → src/data/ (app bundle)
    # Firebase console → Project settings → Service accounts → Generate new private key
    # Save it OUTSIDE the repo, e.g. ~/keys/edutask-admin.json
    export GOOGLE_APPLICATION_CREDENTIALS=~/keys/edutask-admin.json
    npm run seed -- --project <your-project-id>
    ```

    This writes the 7 fields, 35 subjects, and the Multiple choice bank (`data/questions/` → `questions`). Quiz (True / False) statements stay in `data/true-false/` and ship inside the app after `npm run sync:true-false` — they are **not** written to Firestore. Re-running the seed is safe (documents have fixed IDs). Use `--prune` to also delete MCQ questions you removed from `data/`.

    **Optional — demo student account** (matches the UI mocks: Alvin Tan, continue card, 18 Multiple choice attempts, 8 Quiz attempts, tasks). Run the content seed (and `sync:true-false`) first so attempts use real statements:

    ```bash
    npm run seed:demo -- --project <your-project-id>
    ```

    Login after it finishes:

    | Field | Value |
    | --- | --- |
    | Email | `alvin.tan@student.ceit.edu` |
    | Password | `EduTask2026!` |

    Re-running replaces that user’s demo quiz results, sessions and tasks. Override the password with `--password '…'` if you want.
13. **Run the app** — `npx expo start -c` (the `-c` clears the cache so the new env values are picked up), scan the QR code with Expo Go, register an account.

## Data model

```
users/{uid}                          uid, displayName, email, createdAt, updatedAt
users/{uid}/quizSessions/{id}        unfinished set: quizType, subjectId, subjectName, subjectCode, level,
                                     questionIds[10], answers{questionId: option}, checked[], currentIndex,
                                     remainingSeconds, resultId, startedAt, updatedAt
subjectFields/{fieldId}              name, description, icon, order
subjects/{subjectId}                 fieldId, code, name, description, order, isActive
questions/{questionId}               Multiple choice (A–D): subjectId, level (1–15), question, options[],
                                     correctAnswer, explanation, order, isActive
(Quiz True/False)                    Bundled in the app: src/data/true-false/*.json via trueFalseBank.ts
                                     (synced from tools/firestore-seed/data/true-false/)
quizResults/{resultId}               userId, quizType, subjectId, subjectName, subjectCode, level, totalQuestions,
                                     correctAnswers, incorrectAnswers, score, percentage, durationSeconds,
                                     answers[{questionId, question, selectedAnswer, correctAnswer, isCorrect}],
                                     completedAt
tasks/{taskId}                       userId, title, description, subjectId, dueDate, priority,
                                     status, completedAt, createdAt, updatedAt
notifications/{notificationId}      userId, type (taskDue|taskOverdue|quizCompleted), title, body,
                                     read, dedupeKey, createdAt, optional deep-link fields
                                     (taskId, resultId, subjectId, level, quizType)
```

Notes on the few additions to the brief's model:

- **Two practice types.** The original A–D quiz is shown in the app as **Multiple choice**; the True / False set is shown as **Quiz**. `quizType` is `"multipleChoice"` or `"trueFalse"` on results and sessions. Documents written before Quiz existed have no `quizType` and count as Multiple choice, so nothing needs migrating. Session ids are `{subjectId}__L{level}` (Multiple choice) and `{subjectId}__TF__L{level}` (Quiz), so both can be in progress for the same level.

- `quizResults` also stores `subjectName`, `subjectCode`, `durationSeconds` and the graded `answers`, so history and the review screen stay correct even if questions are edited later, with no extra reads.
- `users/{uid}/quizSessions` powers **Continue quiz**: progress is saved as you answer, and deleted in the same atomic batch that writes the result.
- `tasks.completedAt` is `null` while pending.

All timestamps are set with `serverTimestamp()`, and the rules require `== request.time`, so clients can't backdate anything.

## Security rules (`firestore.rules`)

- Users can only read and write **their own** `users/{uid}`, `tasks`, `quizResults`, `notifications` and `quizSessions`. The owner is always `request.auth.uid`; a `userId` sent by the client must equal it.
- Tasks: field types, title/description lengths, priority and status values are validated. `userId` and `createdAt` can't change.
- Notifications: create with `read: false`; updates may flip `read`; deletes allowed. Document ids are derived from `dedupeKey` so retries do not spam the inbox.
- Quiz results: create-only (no edits or deletes). The rules check that the subject exists, the level is 1–15, there are exactly 10 questions, `incorrect = 10 − correct`, `score = correct` and `percentage = correct × 10`.
- Results and sessions accept an optional `quizType` that must be `multipleChoice` or `trueFalse`.
- `subjectFields`, `subjects` and `questions` are **read-only** for students. Writes require the custom claim `admin: true` (`tools/firestore-seed/set-admin.mjs`). The seed tool itself uses the Admin SDK, which bypasses rules. (Legacy `trueFalseQuestions` rules remain for cleanup only; the app no longer reads that collection.)
- There is no `allow ... if true` anywhere; anything not matched is denied.

**Known limitation:** grading happens on the device. The rules make results internally consistent and owned by the right user, but a determined student with dev tools could still submit a fake 10/10, and students can read `correctAnswer` because the app needs it for instant feedback. Fully tamper-proof scoring needs server-side grading (a Cloud Function, Blaze plan) with answers stored where students can't read them. That's a reasonable future step, not something the brief asked for.

## Indexes (`firestore.indexes.json`)

| Collection | Fields | Used by |
| --- | --- | --- |
| `tasks` | `userId` ↑, `dueDate` ↑ | real-time task list |
| `quizResults` | `userId` ↑, `completedAt` ↓ | attempt history, both types (filtered on the device) |
| `notifications` | `userId` ↑, `createdAt` ↓ | notification inbox |
| `questions` | `subjectId` ↑, `level` ↑, `isActive` ↑ | loading a Multiple choice level |
| `subjects` | `fieldId` ↑, `isActive` ↑ | subjects in a field |

### Notifications (inbox + local device banners)

The in-app inbox is Firestore `notifications`. Device banners use **Expo local notifications** (`expo-notifications`) for task due reminders and quiz-completed alerts — no Cloud Functions required. Web shows the inbox only (no OS banners in v1). Reliable banners need a development or production build (EAS); Expo Go is best-effort. Deploy rules and indexes after pulling this feature: `firebase deploy --only firestore:rules,firestore:indexes`.

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

### Quiz (True / False) statements

Put one JSON file per subject in `tools/firestore-seed/data/true-false/`, then sync into the app bundle (Firestore is not used for this content):

```bash
npm run sync:true-false
```

```json
{ "subjectId": "operating-system",
  "levels": { "1": [ { "statement": "A process is a program in execution.", "answer": true, "explanation": "…" } ] } }
```

`answer` is a JSON boolean (`true` / `false`, no quotes). The app maps each statement to `options: ["True", "False"]` with `correctAnswer` `"True"` or `"False"`. `npm run validate` rejects statements that end with "?", duplicates and levels where more than 70% of the answers are the same. The full plan for the 5,250 statements is in [`true-false-question-plan.md`](true-false-question-plan.md). To remove a leftover Firestore `trueFalseQuestions` collection: `npm run delete:true-false -- --project <id>`.
