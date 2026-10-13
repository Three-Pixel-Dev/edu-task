import { QUIZ } from '@/constants/app';
import type { QuizResult, QuizSession, Task } from '@/types';
import { daysFromNow } from '@/utils/date';
import { buildQuiz, gradeAnswers, summarise } from '@/utils/quiz';
import { findSubject, questionBankFor, questionsByIds } from './catalog';

/**
 * Seed data generated relative to "now" so the demo always looks current
 * (tasks due today, recent quiz attempts). Seeded once per user on first
 * login in mock mode, then persisted in AsyncStorage.
 */

const ago = (days: number, hours = 15, minutes = 20) => daysFromNow(-days, hours, minutes).toISOString();

/** Builds a realistic result: answers questions correctly except the given indexes. */
function makeResult(userId: string, subjectId: string, level: number, wrongIndexes: number[], daysAgo: number): QuizResult | null {
  const subject = findSubject(subjectId);
  if (!subject) return null;
  const quiz = buildQuiz(subject, level, questionBankFor(subject));
  const questions = questionsByIds(quiz.questionIds);
  const selections: Record<string, string> = {};
  questions.forEach((q, i) => {
    const wrong = q.options.find((o) => o.id !== q.correctOptionId);
    selections[q.id] = wrongIndexes.includes(i) && wrong ? wrong.id : q.correctOptionId;
  });
  const answers = gradeAnswers(questions, selections);
  const summary = summarise(answers);
  return {
    id: `res_${subjectId}_${level}_${daysAgo}`,
    userId,
    subjectId,
    level,
    score: summary.score,
    totalQuestions: summary.totalQuestions,
    correctAnswers: summary.correctAnswers,
    incorrectAnswers: summary.incorrectAnswers,
    answers,
    durationSeconds: 380 + ((level * 47 + daysAgo * 13) % 180),
    completedAt: ago(daysAgo, 14 + (level % 6), (level * 11) % 60),
  };
}

/** 18 attempts, ~82% average — matches the dashboard copy in the design. */
export function seedQuizResults(userId: string): QuizResult[] {
  const plan: [subjectId: string, level: number, wrong: number[], daysAgo: number][] = [
    ['ceit-4031', 3, [2], 1],
    ['ceit-4031', 2, [4, 8], 3],
    ['ceit-4031', 1, [], 6],
    ['ceit-5051', 2, [1, 5, 9], 4],
    ['ceit-5051', 1, [3, 7], 9],
    ['ceit-5012', 1, [0, 4, 6, 8], 5],
    ['ceit-3042', 6, [5], 7],
    ['ceit-3042', 5, [], 8],
    ['ceit-3042', 4, [2], 10],
    ['ceit-3042', 3, [1, 6], 12],
    ['ceit-3042', 2, [], 14],
    ['ceit-3042', 1, [7], 16],
    ['ceit-5031', 2, [0, 2, 3, 6, 9], 11],
    ['ceit-5031', 1, [4, 5, 8], 13],
    ['ceit-2011', 2, [3], 15],
    ['ceit-2011', 1, [2, 9], 18],
    ['ceit-3011', 1, [0, 3, 7], 20],
    ['ceit-4012', 1, [5, 8], 22],
  ];
  return plan
    .map(([subjectId, level, wrong, days]) => makeResult(userId, subjectId, level, wrong, days))
    .filter((r): r is QuizResult => r !== null)
    .map((r) => ({ ...r, id: `${r.id}_${userId}` }));
}

/** DBMS level 4, paused on question 4 — powers the "Continue quiz" card. */
export function seedQuizSessions(): QuizSession[] {
  const subject = findSubject('ceit-4031');
  if (!subject) return [];
  const quiz = buildQuiz(subject, 4, questionBankFor(subject));
  const questions = questionsByIds(quiz.questionIds);
  const selections: Record<string, string> = {};
  const checked: string[] = [];
  questions.slice(0, 3).forEach((q, i) => {
    const wrong = q.options.find((o) => o.id !== q.correctOptionId);
    selections[q.id] = i === 2 && wrong ? wrong.id : q.correctOptionId;
    checked.push(q.id);
  });
  const now = new Date().toISOString();
  return [
    {
      quizId: quiz.id,
      subjectId: subject.id,
      level: 4,
      questionIds: quiz.questionIds,
      selections,
      checked,
      currentIndex: 3,
      remainingSeconds: QUIZ.durationSeconds - 88,
      startedAt: ago(0, 9, 10),
      updatedAt: now,
    },
  ];
}

type TaskSeed = Pick<Task, 'title' | 'description' | 'subjectId' | 'priority'> & { due: Date; completedDaysAgo?: number };

export function seedTasks(userId: string): Task[] {
  const seeds: TaskSeed[] = [
    // Today & overdue
    { title: 'Database Assignment', subjectId: 'ceit-4031', priority: 'high', due: daysFromNow(0, 23, 59), description: 'Design an ER diagram for the university library system, map it to relational tables and normalise them to 3NF. Submit the PDF report and SQL script on the course portal.' },
    { title: 'Lab 3 Pre-reading', subjectId: 'ceit-5012', priority: 'low', due: daysFromNow(0, 21, 0), description: 'Read chapter 4 on IP addressing and subnetting before Thursday’s lab session.' },
    { title: 'OS Lab Report', subjectId: 'ceit-5051', priority: 'high', due: daysFromNow(-2, 17, 0), description: 'Write up the CPU scheduling simulation (FCFS, SJF, Round Robin) with Gantt charts and average waiting times.' },
    // Upcoming
    { title: 'Networking Report', subjectId: 'ceit-5012', priority: 'medium', due: daysFromNow(5, 23, 59), description: 'Compare TCP and UDP using Wireshark captures from the lab network. 1,500 words.' },
    { title: 'Security Case Study', subjectId: 'ceit-5031', priority: 'low', due: daysFromNow(8, 17, 0), description: 'Analyse a recent data breach: attack vector, impact and the controls that would have prevented it.' },
    { title: 'DSA Problem Set 4', subjectId: 'ceit-3042', priority: 'medium', due: daysFromNow(11, 23, 59), description: 'Graph traversal and shortest path problems 4.1 – 4.8. Include time complexity for each solution.' },
    { title: 'SRS First Draft', subjectId: 'ceit-4012', priority: 'high', due: daysFromNow(14, 12, 0), description: 'Software Requirements Specification for the group project: scope, functional and non-functional requirements, use cases.' },
    // Completed (12)
    { title: 'OOP Mini Project', subjectId: 'ceit-3021', priority: 'medium', due: daysFromNow(-4), completedDaysAgo: 4, description: 'Library management console app using classes, inheritance and interfaces.' },
    { title: 'DSA Problem Set 3', subjectId: 'ceit-3042', priority: 'low', due: daysFromNow(-6), completedDaysAgo: 6, description: 'Heaps, priority queues and heap sort exercises.' },
    { title: 'Networking Lab 2', subjectId: 'ceit-5012', priority: 'medium', due: daysFromNow(-8), completedDaysAgo: 8, description: 'Configure static routes between three routers in Packet Tracer.' },
    { title: 'Normalisation Worksheet', subjectId: 'ceit-4031', priority: 'medium', due: daysFromNow(-9), completedDaysAgo: 10, description: 'Convert the sample invoice table to 1NF, 2NF and 3NF.' },
    { title: 'Logic Gates Lab', subjectId: 'ceit-2011', priority: 'low', due: daysFromNow(-11), completedDaysAgo: 11, description: 'Build and test a full adder on the breadboard. Record truth tables.' },
    { title: 'Cryptography Quiz Prep', subjectId: 'ceit-5041', priority: 'low', due: daysFromNow(-12), completedDaysAgo: 13, description: 'Revise symmetric vs asymmetric encryption and hashing.' },
    { title: 'Use Case Diagrams', subjectId: 'ceit-4012', priority: 'medium', due: daysFromNow(-14), completedDaysAgo: 15, description: 'Draw use case diagrams for the campus parking system.' },
    { title: 'Process Scheduling Exercise', subjectId: 'ceit-5051', priority: 'high', due: daysFromNow(-16), completedDaysAgo: 16, description: 'Calculate turnaround and waiting time for the given process table.' },
    { title: 'Statistics Assignment 1', subjectId: 'ceit-3051', priority: 'medium', due: daysFromNow(-18), completedDaysAgo: 19, description: 'Descriptive statistics and box plots for the exam score dataset.' },
    { title: 'Project Charter Draft', subjectId: 'ceit-4071', priority: 'high', due: daysFromNow(-20), completedDaysAgo: 21, description: 'Charter for the final-year project: goals, scope, stakeholders and milestones.' },
    { title: 'Circuit Analysis Homework', subjectId: 'ceit-2022', priority: 'low', due: daysFromNow(-23), completedDaysAgo: 23, description: 'Kirchhoff’s laws problems 2.1 – 2.10.' },
    { title: 'SQL Practice Set', subjectId: 'ceit-4031', priority: 'medium', due: daysFromNow(-25), completedDaysAgo: 26, description: 'SELECT, JOIN and GROUP BY queries on the university schema.' },
  ];

  return seeds.map((seed, index) => {
    const createdAt = new Date(seed.due.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString();
    const completedAt = seed.completedDaysAgo !== undefined ? ago(seed.completedDaysAgo, 18, 30) : undefined;
    return {
      id: `task_${String(index + 1).padStart(2, '0')}_${userId}`,
      userId,
      title: seed.title,
      description: seed.description,
      subjectId: seed.subjectId,
      dueDate: seed.due.toISOString(),
      priority: seed.priority,
      status: completedAt ? 'completed' : 'pending',
      completedAt,
      createdAt,
      updatedAt: completedAt ?? createdAt,
    };
  });
}
