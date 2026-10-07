# EduTask

A mobile learning and academic task app for CEIT students — level-based IT quizzes, an assignment tracker and a student profile.

Built with **React Native + Expo (SDK 57) + TypeScript + Expo Router**. It runs on local demo data out of the box and is structured so Firebase (Auth + Firestore) can be switched on without changing any screen.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS). Everything used is bundled in Expo Go — no development build is required.

**Demo login** (mock mode): `alvin.tan@student.ceit.edu` / `edutask123` — or tap the demo card on the login screen. You can also register a new account; new accounts start with empty tasks and quiz history so you can see the empty states.

| Command | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run typecheck` | Strict TypeScript check |
| `npm run lint` | ESLint (Expo config, React hooks rules) |
| `npm run doctor` | `expo-doctor` dependency checks |

## Features

- **Auth** — log in, register, log out, password reset, session persistence (splash → session check → login or app).
- **Home** — greeting, Continue Quiz card, quick access, recent subjects, task summary, pull to refresh.
- **Quiz** — Field → Subject → Level (1–15) → 10 multiple-choice questions → Result.
  - The 7 client-defined fields, 28 subjects with codes, search on the subject list.
  - Level grid shows *completed*, *in progress* and *available* (no unlocking rules).
  - Questions: large answer cards, selected state, **Check answer → feedback (correct / incorrect + explanation) → Next**, Previous to review, 10-minute timer, autosave so you can leave and **Continue** later, automatic submit when time runs out.
  - Result: score ring, correct / incorrect / total, subject and level, question-by-question review, Try again / Back to Quiz.
- **Tasks** — Today / Upcoming / Completed with filters, overdue and due-soon colouring, quick complete with Undo, details, create, edit, delete with confirmation, native date and time pickers, searchable subject picker.
- **Profile** — student info, quiz and task statistics, reminder setting, reset demo data, log out.
- **States** — skeleton loading, empty, error with retry, form validation, success feedback, disabled buttons.

## Project structure

```
app/                    Expo Router routes — thin files that re-export a screen
  _layout.tsx           fonts, providers, splash, auth-guarded Stack (Stack.Protected)
  (auth)/               login, register
  (tabs)/               index (Home), quiz, tasks, profile
  quiz/                 fields, subjects, levels, questions, result
  tasks/                create, [id], edit
src/
  features/             screen components grouped by area (auth, home, quiz, tasks, profile)
  components/
    ui/                 Button, Card, Input, Screen, ScreenHeader, SectionHeader, ProgressBar,
                        Badge, StatTile, ListRow, SegmentedControl, Toast, Empty/Loading/Error states…
    quiz/               FieldCard, SubjectCard, LevelCard, QuizOption, AnswerFeedback, ScoreRing, QuizTimer…
    tasks/              TaskCard, SubjectPicker, DueDateField, PriorityPicker
  hooks/                useAuth, useTasks, useQuiz, useQuizSession, useAsync, useCountdown, useResponsive
  store/                React Context providers (Auth, Tasks, Quiz) — no Redux
  services/             firebase, auth, tasks, quiz, storage, preferences
  data/                 mock catalogue (fields, subjects, questions), demo users, seed data
  types/                shared domain types (User, SubjectField, Subject, Quiz, Question, QuizAnswer, QuizResult, Task…)
  constants/            app constants, storage keys, typed route builders
  theme/                colors, spacing, typography, shadows
  utils/                quiz scoring, dates, validation, formatting
assets/images/          app icon, adaptive icon, splash
docs/firebase.md        Firebase setup and data model
firestore.rules         starter security rules
```

**Data flow:** screen → hook → context store → service → (mock AsyncStorage | Firebase). Screens never import Firebase.

## Design system

The theme in `src/theme` is the single source for colours, spacing, radii and type — screens don't hard-code hex values.

- Brand: Primary `#2563EB`, Primary dark `#1D4ED8`, Background `#F8FAFC`, Card `#FFFFFF`, Text `#0F172A`, Secondary `#64748B`, Success `#16A34A`, Warning `#F59E0B`, Error `#DC2626`, Accent `#7C3AED`.
- Status text uses darker shades (`#15803D`, `#92400E`, `#B91C1C`) so it meets WCAG AA; the brand status colours are used for dots, rings and borders.
- Type: Inter (400/500/600/700) and Geist Mono for subject codes and the timer, loaded with `expo-font`.
- Icons: Feather via `@expo/vector-icons` (the outline set Lucide is based on).

## Device support & accessibility

- Safe areas on every screen (notches, home indicator); sticky bottom actions for one-handed use.
- Responsive gutters for small (< 360pt), normal and large (≥ 428pt) phones; content capped at 640pt and the level grid goes to 5 columns on tablets.
- Touch targets ≥ 44pt (primary buttons 52pt); Dynamic Type supported up to 1.4×.
- Screen-reader labels and roles on all controls (`radio`, `checkbox`, `progressbar`, `timer`, `alert`), selection shown with more than colour.

## Firebase

Add your web app config to `.env` (see `.env.example`) and restart with `npx expo start -c`. Details, data model and rules: [`docs/firebase.md`](docs/firebase.md).

## Roadmap

| Phase | Status |
| --- | --- |
| 1 – 11: setup, theme, navigation, components, auth UI, Home, quiz flow, result, tasks, profile, mock data | Done |
| 12: Firebase | Services ready for Auth, `users`, `tasks`, `quizResults`; move quiz content to Firestore next |
