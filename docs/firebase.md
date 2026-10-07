# Firebase integration (Phase 12)

EduTask runs on local mock data until Firebase is configured, so the whole UI works in Expo Go with no setup. Switching to Firebase does not touch any screen: every screen talks to hooks → store → `src/services/*`, and each service picks a Firebase or mock implementation based on `isFirebaseConfigured`.

## 1. Connect a project

1. Create a Firebase project and add a **Web app** (the Firebase JS SDK is used, which works in Expo Go — no native modules or development build needed).
2. Enable **Authentication → Email/Password**.
3. Create a **Cloud Firestore** database.
4. Copy `.env.example` to `.env`, paste the web config values, and restart Expo with a clean cache: `npx expo start -c`.
5. Deploy `firestore.rules` (Firebase console → Firestore → Rules, or `firebase deploy --only firestore:rules`).

Session persistence uses `initializeAuth` with `getReactNativePersistence(AsyncStorage)` (see `src/services/firebase.ts`).

## 2. What moves to Firebase right away

| Data | Service | Collection |
| --- | --- | --- |
| Accounts, login, logout, password reset | `src/services/auth.ts` | Firebase Auth + `users/{uid}` |
| Tasks (create, edit, complete, delete) | `src/services/tasks.ts` | `tasks` |
| Quiz results | `src/services/quiz.ts` → `quizResultService` | `quizResults` |

In-progress quiz sessions (for "Continue quiz") stay on the device in AsyncStorage on purpose: they change every few seconds and don't need to sync.

## 3. Content (fields, subjects, questions)

The catalogue ships with the app in `src/data/` and is served through `quizContent` in `src/services/quiz.ts`. Its functions are already `async`, so moving content to Firestore only means replacing their bodies with Firestore reads from `subjectFields`, `subjects` and `questions`. Seed those collections from `src/data/fields.ts`, `subjects.ts` and `questions.ts`.

## 4. Data model

```
subjectFields/{fieldId}      name, description, icon, order
subjects/{subjectId}         fieldId, code, name, levelCount (15)
questions/{questionId}       fieldId, subjectId?, prompt, options[{id,text}], correctOptionId, explanation
quizzes/{subjectId:L{n}}     subjectId, level, questionIds[10], durationSeconds   (optional — can be derived)

users/{uid}                  fullName, email, studentId, program, year, createdAt
quizResults/{resultId}       userId, subjectId, level, score, totalQuestions,
                             correctAnswers, incorrectAnswers, answers[], durationSeconds, completedAt
tasks/{taskId}               userId, title, description, subjectId, dueDate, priority,
                             status, completedAt?, createdAt, updatedAt
```

Relationships: `subjectField → subjects → levels (1–15) → questions`. Dates are ISO-8601 strings so they serialise identically in AsyncStorage and Firestore.

## 5. Indexes

The queries filter on `userId` only and sort on the client, so no composite indexes are needed yet.
