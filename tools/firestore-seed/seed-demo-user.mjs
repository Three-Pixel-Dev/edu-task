#!/usr/bin/env node
/**
 * Seeds one demo student account that matches the EduTask Web UI mock:
 *   email:    alvin.tan@student.ceit.edu
 *   password: EduTask2026!   (override with --password)
 *
 * Writes:
 *   - Auth user + users/{uid} profile
 *   - 18 Multiple choice quizResults (quizType "multipleChoice")
 *   - 8 Quiz (True / False) quizResults (quizType "trueFalse")
 *   - one unfinished quizSession (Continue quiz · DBMS L4 · Q4/10)
 *   - tasks (2 due today, overdue, upcoming, 12 completed)
 *
 * Safe to re-run: uses fixed document ids under demo_* and replaces them.
 *
 *   node seed-demo-user.mjs --project <projectId>
 *   node seed-demo-user.mjs --project <projectId> --password 'YourPass123!'
 *
 * Credentials: GOOGLE_APPLICATION_CREDENTIALS → service-account JSON
 * (same key as the content seed), e.g. D:\edutask-admin.json
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const TRUE_FALSE_DIR = path.join(here, 'data', 'true-false');

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const DEMO = {
  email: 'alvin.tan@student.ceit.edu',
  displayName: 'Alvin Tan',
  password: option('--password') ?? 'EduTask2026!',
};

const SUBJECTS = {
  dbms: { id: 'database-management-system', code: 'CEIT-4031', name: 'Database Management System' },
  os: { id: 'operating-system', code: 'CEIT-5051', name: 'Operating System' },
  net: { id: 'networking-fundamentals', code: 'CEIT-5012', name: 'Networking Fundamentals' },
  dsa: { id: 'data-structures-algorithms', code: 'CEIT-4041', name: 'Data Structures and Algorithms' },
  sec: { id: 'information-security', code: 'CEIT-6003', name: 'Information Security' },
  oop: { id: 'object-oriented-programming', code: 'CEIT-3011', name: 'Object Oriented Programming (Using C++)' },
  se: { id: 'software-engineering', code: 'CEIT-5061', name: 'Software Engineering' },
  dig: { id: 'digital-electronics', code: 'CEIT-3010', name: 'Digital Electronics' },
  crypto: { id: 'cryptography-network-security', code: 'CEIT-7013', name: 'Cryptography and Network Security' },
  research: { id: 'research-methodology', code: 'CEIT-9036', name: 'Research Methodology & Statistical Analysis' },
  pm: { id: 'project-management', code: 'CEIT-8026', name: 'Project Management' },
  circuit: { id: 'engineering-circuit-analysis', code: 'CEIT-3020', name: 'Engineering Circuit Analysis' },
};

/** Multiple choice: [subjectKey, level, correctAnswers, daysAgo] — newest first in the UI. */
const ATTEMPTS = [
  ['dbms', 4, 8, 7],
  ['dbms', 3, 9, 9],
  ['os', 2, 7, 10],
  ['net', 1, 6, 11],
  ['dsa', 6, 10, 13],
  ['sec', 2, 5, 15],
  ['dbms', 2, 8, 16],
  ['dbms', 1, 10, 18],
  ['os', 1, 8, 20],
  ['dsa', 5, 10, 21],
  ['dsa', 4, 9, 23],
  ['dsa', 3, 8, 25],
  ['dsa', 2, 10, 27],
  ['dsa', 1, 9, 29],
  ['sec', 1, 7, 30],
  ['dig', 2, 9, 32],
  ['oop', 1, 7, 34],
  ['se', 1, 8, 36],
];

/**
 * Quiz (True / False) attempts: [subjectKey, level, correctAnswers, daysAgo].
 * The levels used here have real statements in data/true-false/ (run the
 * content seed first); otherwise placeholder statements are used.
 */
const TRUE_FALSE_ATTEMPTS = [
  ['dbms', 3, 9, 1],
  ['os', 1, 8, 2],
  ['dbms', 2, 7, 3],
  ['net', 1, 10, 4],
  ['dsa', 1, 6, 5],
  ['sec', 1, 8, 6],
  ['dbms', 1, 9, 8],
  ['se', 1, 7, 12],
];

function daysFromNow(days, hours = 23, minutes = 59) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickQuestions(pool, count = 10, trueFalse = false) {
  if (pool.length >= count) return shuffle(pool).slice(0, count);
  // Fallback placeholders if a level isn't fully seeded yet.
  return Array.from({ length: count }, (_, i) => {
    const existing = pool[i % Math.max(pool.length, 1)];
    if (existing) return existing;
    return trueFalse
      ? {
          id: `demo-tf-placeholder-${i + 1}`,
          question: `Demo statement ${i + 1}.`,
          options: ['True', 'False'],
          correctAnswer: i % 2 === 0 ? 'True' : 'False',
        }
      : {
          id: `demo-q-placeholder-${i + 1}`,
          question: `Demo question ${i + 1}`,
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
        };
  });
}

function buildAnswers(questions, correctCount) {
  return questions.map((q, index) => {
    const isCorrect = index < correctCount;
    const wrong = (q.options ?? []).find((opt) => opt !== q.correctAnswer) ?? 'Wrong answer';
    return {
      questionId: q.id,
      question: q.question,
      selectedAnswer: isCorrect ? q.correctAnswer : wrong,
      correctAnswer: q.correctAnswer,
      isCorrect,
    };
  });
}

async function ensureAuthUser(auth) {
  try {
    const existing = await auth.getUserByEmail(DEMO.email);
    await auth.updateUser(existing.uid, {
      password: DEMO.password,
      displayName: DEMO.displayName,
      emailVerified: true,
      disabled: false,
    });
    console.log(`Updated Auth user ${DEMO.email} (${existing.uid})`);
    return existing.uid;
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    const created = await auth.createUser({
      email: DEMO.email,
      password: DEMO.password,
      displayName: DEMO.displayName,
      emailVerified: true,
    });
    console.log(`Created Auth user ${DEMO.email} (${created.uid})`);
    return created.uid;
  }
}

async function loadQuestionsBySubjectLevel(db, collectionName = 'questions') {
  const snap = await db.collection(collectionName).where('isActive', '==', true).get();
  const map = new Map();
  for (const doc of snap.docs) {
    const data = doc.data();
    const key = `${data.subjectId}::${data.level}`;
    const list = map.get(key) ?? [];
    list.push({
      id: doc.id,
      question: data.question,
      options: data.options ?? [],
      correctAnswer: data.correctAnswer,
    });
    map.set(key, list);
  }
  return map;
}

/** Quiz (True / False) pools from local data/true-false/*.json (not Firestore). */
async function loadTrueFalseBySubjectLevel() {
  const map = new Map();
  let files;
  try {
    files = (await readdir(TRUE_FALSE_DIR)).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  } catch {
    return map;
  }
  for (const file of files) {
    const raw = JSON.parse(await readFile(path.join(TRUE_FALSE_DIR, file), 'utf8'));
    const subjectId = raw.subjectId ?? file.replace(/\.json$/, '');
    for (const [levelKey, list] of Object.entries(raw.levels ?? {})) {
      const level = Number(levelKey);
      const key = `${subjectId}::${level}`;
      const pool = (Array.isArray(list) ? list : [])
        .filter((item) => item && item.isActive !== false)
        .map((item, i) => ({
          id: `${subjectId}__tf__l${level}__q${String(i + 1).padStart(2, '0')}`,
          question: String(item.statement ?? '').trim(),
          options: ['True', 'False'],
          correctAnswer: item.answer ? 'True' : 'False',
        }));
      map.set(key, pool);
    }
  }
  return map;
}

async function clearPreviousDemoData(db, uid) {
  const batchDelete = async (refs) => {
    for (let i = 0; i < refs.length; i += 400) {
      const batch = db.batch();
      refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
  };

  const results = await db.collection('quizResults').where('userId', '==', uid).get();
  const tasks = await db.collection('tasks').where('userId', '==', uid).get();
  const sessions = await db.collection('users').doc(uid).collection('quizSessions').get();
  await batchDelete([...results.docs.map((d) => d.ref), ...tasks.docs.map((d) => d.ref), ...sessions.docs.map((d) => d.ref)]);
  console.log(`Cleared previous demo docs: ${results.size} results, ${tasks.size} tasks, ${sessions.size} sessions`);
}

function taskSeeds() {
  return [
    {
      id: 'demo_task_01',
      title: 'Database Assignment',
      subjectId: SUBJECTS.dbms.id,
      priority: 'high',
      due: daysFromNow(0, 23, 59),
      description:
        'Design an ER diagram for the university library system, map it to relational tables and normalise them to 3NF. Submit the PDF report and SQL script on the course portal.',
    },
    {
      id: 'demo_task_02',
      title: 'Lab 3 Pre-reading',
      subjectId: SUBJECTS.net.id,
      priority: 'low',
      due: daysFromNow(0, 21, 0),
      description: 'Read chapter 4 on IP addressing and subnetting before Thursday’s lab session.',
    },
    {
      id: 'demo_task_03',
      title: 'OS Lab Report',
      subjectId: SUBJECTS.os.id,
      priority: 'high',
      due: daysFromNow(-2, 17, 0),
      description: 'Write up the CPU scheduling simulation (FCFS, SJF, Round Robin) with Gantt charts and average waiting times.',
    },
    {
      id: 'demo_task_04',
      title: 'Networking Report',
      subjectId: SUBJECTS.net.id,
      priority: 'medium',
      due: daysFromNow(5, 23, 59),
      description: 'Compare TCP and UDP using Wireshark captures from the lab network. 1,500 words.',
    },
    {
      id: 'demo_task_05',
      title: 'Security Case Study',
      subjectId: SUBJECTS.sec.id,
      priority: 'low',
      due: daysFromNow(8, 17, 0),
      description: 'Analyse a recent data breach: attack vector, impact and the controls that would have prevented it.',
    },
    {
      id: 'demo_task_06',
      title: 'DSA Problem Set 4',
      subjectId: SUBJECTS.dsa.id,
      priority: 'medium',
      due: daysFromNow(11, 23, 59),
      description: 'Graph traversal and shortest path problems 4.1 – 4.8. Include time complexity for each solution.',
    },
    {
      id: 'demo_task_07',
      title: 'SRS First Draft',
      subjectId: SUBJECTS.se.id,
      priority: 'high',
      due: daysFromNow(14, 12, 0),
      description: 'Software Requirements Specification for the group project: scope, functional and non-functional requirements, use cases.',
    },
    // Completed (12)
    { id: 'demo_task_08', title: 'OOP Mini Project', subjectId: SUBJECTS.oop.id, priority: 'medium', due: daysFromNow(-4), completedDaysAgo: 4, description: 'Library management console app using classes, inheritance and interfaces.' },
    { id: 'demo_task_09', title: 'DSA Problem Set 3', subjectId: SUBJECTS.dsa.id, priority: 'low', due: daysFromNow(-6), completedDaysAgo: 6, description: 'Heaps, priority queues and heap sort exercises.' },
    { id: 'demo_task_10', title: 'Networking Lab 2', subjectId: SUBJECTS.net.id, priority: 'medium', due: daysFromNow(-8), completedDaysAgo: 8, description: 'Configure static routes between three routers in Packet Tracer.' },
    { id: 'demo_task_11', title: 'Normalisation Worksheet', subjectId: SUBJECTS.dbms.id, priority: 'medium', due: daysFromNow(-9), completedDaysAgo: 10, description: 'Convert the sample invoice table to 1NF, 2NF and 3NF.' },
    { id: 'demo_task_12', title: 'Logic Gates Lab', subjectId: SUBJECTS.dig.id, priority: 'low', due: daysFromNow(-11), completedDaysAgo: 11, description: 'Build and test a full adder on the breadboard. Record truth tables.' },
    { id: 'demo_task_13', title: 'Cryptography Quiz Prep', subjectId: SUBJECTS.crypto.id, priority: 'low', due: daysFromNow(-12), completedDaysAgo: 13, description: 'Revise symmetric vs asymmetric encryption and hashing.' },
    { id: 'demo_task_14', title: 'Use Case Diagrams', subjectId: SUBJECTS.se.id, priority: 'medium', due: daysFromNow(-14), completedDaysAgo: 15, description: 'Draw use case diagrams for the campus parking system.' },
    { id: 'demo_task_15', title: 'Process Scheduling Exercise', subjectId: SUBJECTS.os.id, priority: 'high', due: daysFromNow(-16), completedDaysAgo: 16, description: 'Calculate turnaround and waiting time for the given process table.' },
    { id: 'demo_task_16', title: 'Statistics Assignment 1', subjectId: SUBJECTS.research.id, priority: 'medium', due: daysFromNow(-18), completedDaysAgo: 19, description: 'Descriptive statistics and box plots for the exam score dataset.' },
    { id: 'demo_task_17', title: 'Project Charter Draft', subjectId: SUBJECTS.pm.id, priority: 'high', due: daysFromNow(-20), completedDaysAgo: 21, description: 'Charter for the final-year project: goals, scope, stakeholders and milestones.' },
    { id: 'demo_task_18', title: 'Circuit Analysis Homework', subjectId: SUBJECTS.circuit.id, priority: 'low', due: daysFromNow(-23), completedDaysAgo: 23, description: 'Kirchhoff’s laws problems 2.1 – 2.10.' },
    { id: 'demo_task_19', title: 'SQL Practice Set', subjectId: SUBJECTS.dbms.id, priority: 'medium', due: daysFromNow(-25), completedDaysAgo: 26, description: 'SELECT, JOIN and GROUP BY queries on the university schema.' },
  ];
}

async function main() {
  if (flag('--help')) {
    console.log(`Usage: node seed-demo-user.mjs --project <projectId> [--password <pwd>]`);
    return;
  }

  const projectId = option('--project') ?? process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    console.error('Pass --project <your-firebase-project-id>.');
    process.exit(1);
  }

  const { initializeApp, applicationDefault, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const { getFirestore, Timestamp, FieldValue } = await import('firebase-admin/firestore');

  let credential = applicationDefault();
  // Convenience: allow a local admin key path used earlier in this project.
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? 'D:\\edutask-admin.json';
  try {
    const raw = await readFile(keyPath, 'utf8');
    credential = cert(JSON.parse(raw));
    console.log(`Using service account key: ${keyPath}`);
  } catch {
    console.log('Using application default credentials');
  }

  initializeApp({ credential, projectId });
  const auth = getAuth();
  const db = getFirestore();

  const uid = await ensureAuthUser(auth);
  const now = Timestamp.now();

  await db.collection('users').doc(uid).set(
    {
      uid,
      displayName: DEMO.displayName,
      email: DEMO.email,
      createdAt: Timestamp.fromDate(daysFromNow(-60, 10, 0)),
      updatedAt: now,
    },
    { merge: true },
  );
  console.log(`Wrote users/${uid}`);

  await clearPreviousDemoData(db, uid);

  const questionMap = await loadQuestionsBySubjectLevel(db);
  const trueFalseMap = await loadTrueFalseBySubjectLevel();
  console.log(`Loaded question pools for ${questionMap.size} multiple choice and ${trueFalseMap.size} quiz (local true/false) subject/level pairs`);

  // Quiz results
  const resultBatch = db.batch();
  ATTEMPTS.forEach(([key, level, correct, daysAgo], index) => {
    const subject = SUBJECTS[key];
    const pool = questionMap.get(`${subject.id}::${level}`) ?? [];
    const questions = pickQuestions(pool, 10);
    const answers = buildAnswers(questions, correct);
    const completedAt = Timestamp.fromDate(daysFromNow(-daysAgo, 14 + (level % 6), (level * 11) % 60));
    const ref = db.collection('quizResults').doc(`demo_result_${String(index + 1).padStart(2, '0')}`);
    resultBatch.set(ref, {
      userId: uid,
      quizType: 'multipleChoice',
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      level,
      totalQuestions: 10,
      correctAnswers: correct,
      incorrectAnswers: 10 - correct,
      score: correct,
      percentage: correct * 10,
      durationSeconds: 380 + ((level * 47 + daysAgo * 13) % 180),
      answers,
      completedAt,
    });
  });
  TRUE_FALSE_ATTEMPTS.forEach(([key, level, correct, daysAgo], index) => {
    const subject = SUBJECTS[key];
    const pool = trueFalseMap.get(`${subject.id}::${level}`) ?? [];
    const questions = pickQuestions(pool, 10, true);
    const answers = buildAnswers(questions, correct);
    const completedAt = Timestamp.fromDate(daysFromNow(-daysAgo, 11 + (level % 7), (level * 17 + index * 7) % 60));
    resultBatch.set(db.collection('quizResults').doc(`demo_tf_result_${String(index + 1).padStart(2, '0')}`), {
      userId: uid,
      quizType: 'trueFalse',
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      level,
      totalQuestions: 10,
      correctAnswers: correct,
      incorrectAnswers: 10 - correct,
      score: correct,
      percentage: correct * 10,
      durationSeconds: 140 + ((level * 31 + daysAgo * 19) % 120),
      answers,
      completedAt,
    });
  });
  await resultBatch.commit();
  console.log(`Wrote ${ATTEMPTS.length} multiple choice + ${TRUE_FALSE_ATTEMPTS.length} quiz (true/false) quizResults`);

  // Continue-quiz session: DBMS level 4, paused on question 4 (index 3)
  const sessionSubject = SUBJECTS.dbms;
  const sessionQuestions = pickQuestions(questionMap.get(`${sessionSubject.id}::4`) ?? [], 10);
  const answered = sessionQuestions.slice(0, 3);
  const sessionAnswers = {};
  const checked = [];
  answered.forEach((q, i) => {
    const wrong = (q.options ?? []).find((opt) => opt !== q.correctAnswer) ?? 'Wrong answer';
    sessionAnswers[q.id] = i === 2 ? wrong : q.correctAnswer;
    checked.push(q.id);
  });
  // Same id format the app uses (sessionIdFor): {subjectId}__L{level}
  await db.collection('users').doc(uid).collection('quizSessions').doc(`${sessionSubject.id}__L4`).set({
    quizType: 'multipleChoice',
    subjectId: sessionSubject.id,
    subjectName: sessionSubject.name,
    subjectCode: sessionSubject.code,
    level: 4,
    questionIds: sessionQuestions.map((q) => q.id),
    answers: sessionAnswers,
    checked,
    currentIndex: 3,
    remainingSeconds: 512,
    resultId: 'demo_result_pending_dbms_l4',
    startedAt: Timestamp.fromDate(daysFromNow(0, 9, 10)),
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log('Wrote continue-quiz session (DBMS · Level 4 · Question 4/10)');

  // Tasks
  const taskBatch = db.batch();
  for (const seed of taskSeeds()) {
    const createdAt = Timestamp.fromDate(new Date(seed.due.getTime() - 9 * 24 * 60 * 60 * 1000));
    const completedAt =
      seed.completedDaysAgo !== undefined ? Timestamp.fromDate(daysFromNow(-seed.completedDaysAgo, 18, 30)) : null;
    taskBatch.set(db.collection('tasks').doc(seed.id), {
      userId: uid,
      title: seed.title,
      description: seed.description,
      subjectId: seed.subjectId,
      dueDate: Timestamp.fromDate(seed.due),
      priority: seed.priority,
      status: completedAt ? 'completed' : 'pending',
      completedAt,
      createdAt,
      updatedAt: completedAt ?? createdAt,
    });
  }
  await taskBatch.commit();
  console.log(`Wrote ${taskSeeds().length} tasks`);

  console.log('\nDemo account ready:');
  console.log(`  Email:    ${DEMO.email}`);
  console.log(`  Password: ${DEMO.password}`);
  console.log(`  Name:     ${DEMO.displayName}`);
  console.log(`  UID:      ${uid}`);
  console.log('\nLog in on web or mobile to see Home, Multiple choice, Quiz and Tasks populated like the mocks.');
}

main().catch((error) => {
  console.error('\nSeed failed:', error.message ?? error);
  process.exit(1);
});
