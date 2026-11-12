# EduTask

A mobile learning and task app for CEIT students: level-based IT quizzes, an assignment manager and a student profile.

**Stack:** React Native · Expo SDK 58 · TypeScript (strict) · Expo Router · Firebase Authentication · Cloud Firestore (Firebase JS SDK). There's no backend server and no mock data; everything is stored in your Firebase project. It runs in **Expo Go**.

## Requirements

- Node.js 22.13+ (24.3+ or 26+)
- Expo Go app on iOS or Android

## Quick start

```bash
npm install
cp .env.example .env        # fill in your Firebase web app config
npx expo start -c           # scan the QR code with Expo Go
```

The first time, follow the **setup checklist in [`docs/firebase.md`](docs/firebase.md)**: create the project, enable Email/Password, create Firestore, deploy rules and indexes, then seed the subjects and questions. Without a config the app opens a "Connect Firebase" screen listing what's missing.

| Command | |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run web` | Expo web dev server |
| `npm run build:web` | Build static web export (`dist/`) |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (Expo config + React hooks rules) |
| `firebase deploy --only firestore` | Deploy rules + indexes |
| `cd tools/firestore-seed && npm run validate` / `npm run seed -- --project <id>` | Check / load academic content (admin only) |

## Web (Netlify)

EduTask is configured for static hosting on Netlify via [`netlify.toml`](netlify.toml) (`npm run build:web` → `dist/`).

1. **Link repo in Netlify:** Netlify detects build command and publish directory automatically from `netlify.toml`.
2. **Environment variables:** In Netlify Site configuration → Environment variables, add the keys from [`.env.example`](.env.example) (`EXPO_PUBLIC_FIREBASE_*`).
3. **Firebase authorized domains:** In Firebase Console → Authentication → Settings → **Authorized domains**, add your Netlify subdomain (`<site-name>.netlify.app`) and any custom domain so web authentication succeeds.

## What works

- **Auth:** register (also creates `users/{uid}`), login, logout, password reset, and sessions that survive app restarts. The splash screen stays up while Firebase restores the session, so the login screen never flashes.
- **Two practice types**, each with its own tab (mobile) / sidebar item (web):
  - **Multiple choice** — the original A–D questions (`questions` collection).
  - **Quiz** — True / False statements bundled from `tools/firestore-seed/data/true-false/` (`npm run sync:true-false`). Plan: [`docs/true-false-question-plan.md`](docs/true-false-question-plan.md).
- **Practice flow (both types):** Field → Subject → Level 1–15 → 10 questions → Result. Fields, subjects and Multiple choice come from Firestore; Quiz (True / False) loads from the local JSON bank.
  - Each attempt picks 10 unique questions in random order. With fewer than 10 the app shows *"Not enough questions are available for this level yet"* plus the current count.
  - Answering works as: check answer → feedback (correct or incorrect, with an explanation) → next.
  - There's a 10-minute timer, and progress autosaves so **Continue** works (per type).
  - Submission is idempotent: double taps or retries can't create duplicate results.
  - The result is saved to `quizResults` with the review answers, and history updates in real time. History can be filtered by All / Multiple choice / Quiz.
- **Tasks:** create, list, details, edit, complete (with Undo) and delete, all in Firestore.
  - The list updates live through `onSnapshot`.
  - Unconfirmed local changes are marked "Not synced yet".
- **Home / Profile:** live name, Continue card, task summary, upcoming tasks, recent subjects, recent attempts, and quiz and task statistics. Every section has loading, empty and error states.
- **Security:** `firestore.rules` gives per-user isolation for users, tasks, results and sessions; validates task and result fields; and makes quiz content read-only for students. See [`docs/firebase.md`](docs/firebase.md#security-rules-firestorerules).

## Project structure

```
app/                         Expo Router routes (thin: each re-exports a screen)
  _layout.tsx                fonts, providers, splash, config check, auth-guarded Stack
  (auth)/ login, register     (tabs)/ index, quiz, tasks, profile
  quiz/ fields, subjects, levels, questions, result, history
  tasks/ create, [id], edit
src/
  services/                  ALL Firebase access lives here
    firebase.ts              single init: app, auth (AsyncStorage persistence), firestore
    auth.ts users.ts subjects.ts quizzes.ts quizResults.ts tasks.ts
    errors.ts                friendly error mapping + write/read timeouts
    converters.ts            safe Firestore → typed model conversion
  providers/                 AuthProvider (onAuthStateChanged + profile), TasksProvider and
                             QuizProvider (one real-time listener each, shared by screens)
  hooks/                     useAuth, useProfile, useSubjectFields, useSubjects, useSubjectCatalog,
                             useQuizHistory, useQuizSession, useTasks, useTaskActions, useNetworkStatus…
  features/                  screens by area (auth, home, quiz, tasks, profile, setup)
  components/                ui/ (design system), quiz/, tasks/
  utils/                     quiz selection and grading, validation, dates (pure, testable)
  theme/ types/ constants/
firestore.rules  firestore.indexes.json  firebase.json  storage.rules (deny-all placeholder)
tools/firestore-seed/        admin-only Node script (Firebase Admin SDK) + data/ (fields, subjects, questions)
docs/firebase.md             setup checklist, data model, rules, indexes, offline behaviour
```

Data flow: **screen → hook → provider/service → Firebase.** Screens never import Firebase directly. The Admin SDK lives only in `tools/` and is excluded from Metro, TypeScript and the app bundle.

## Design

The design is unchanged from the approved EduTask mobile UI: the light theme in `src/theme` (Primary `#2563EB`, etc.), Inter + Geist Mono, Feather icons, 44pt+ touch targets, safe-area aware layouts and screen-reader labels.
