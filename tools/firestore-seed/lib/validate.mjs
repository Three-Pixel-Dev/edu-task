/**
 * Validates seed content against the rules the app relies on. Returns a list
 * of human-readable problems (empty = valid). Nothing is written if any
 * problem is found.
 */

export const QUESTIONS_PER_QUIZ = 10;
export const LEVEL_COUNT = 15;
export const REQUIRED_FIELD_NAMES = [
  'Electronic & Hardware',
  'Software',
  'Network and Communication',
  'Security',
  'Data Science',
  'Signal Processing',
  'Project Management & Practice',
];

const ID_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;
const isText = (v, max = 1000) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

export function validateSeed({ subjectFields, subjects, questions, trueFalseQuestions = [] }, knownIcons) {
  const problems = [];
  const fail = (where, msg) => problems.push(`${where}: ${msg}`);

  // ── Fields ──
  if (!Array.isArray(subjectFields)) return ['subjectFields.json must be an array'];
  const fieldIds = new Set();
  subjectFields.forEach((f, i) => {
    const where = `subjectFields[${i}] (${f?.id ?? '?'})`;
    if (!ID_RE.test(f?.id ?? '')) fail(where, 'id must be lowercase letters, digits and dashes');
    if (fieldIds.has(f.id)) fail(where, 'duplicate id');
    fieldIds.add(f.id);
    if (!isText(f.name, 100)) fail(where, 'name is required');
    if (typeof f.description !== 'string') fail(where, 'description must be a string');
    if (!Number.isInteger(f.order)) fail(where, 'order must be an integer');
    if (knownIcons && !knownIcons.has(f.icon)) fail(where, `icon "${f.icon}" is not a Feather icon name`);
  });
  const names = new Set(subjectFields.map((f) => f.name));
  for (const required of REQUIRED_FIELD_NAMES) {
    if (!names.has(required)) fail('subjectFields', `missing required field "${required}" (client-defined name, must match exactly)`);
  }

  // ── Subjects ──
  if (!Array.isArray(subjects)) return [...problems, 'subjects.json must be an array'];
  const subjectIds = new Set();
  const codes = new Set();
  subjects.forEach((s, i) => {
    const where = `subjects[${i}] (${s?.id ?? '?'})`;
    if (!ID_RE.test(s?.id ?? '')) fail(where, 'id must be lowercase letters, digits and dashes');
    if (subjectIds.has(s.id)) fail(where, 'duplicate id');
    subjectIds.add(s.id);
    if (!fieldIds.has(s.fieldId)) fail(where, `unknown fieldId "${s.fieldId}"`);
    if (!/^[A-Z]+-\d+$/.test(s.code ?? '')) fail(where, `code "${s.code}" should look like CEIT-4031`);
    if (codes.has(s.code)) fail(where, `duplicate code ${s.code}`);
    codes.add(s.code);
    if (!isText(s.name, 120)) fail(where, 'name is required');
    if (typeof s.description !== 'string') fail(where, 'description must be a string');
    if (!Number.isInteger(s.order)) fail(where, 'order must be an integer');
    if (typeof s.isActive !== 'boolean') fail(where, 'isActive must be true or false');
  });

  // ── Questions ──
  const seenText = new Map();
  questions.forEach(({ id, source, data: q }) => {
    const where = `${source} (${id})`;
    if (!subjectIds.has(q.subjectId)) fail(where, `unknown subjectId "${q.subjectId}"`);
    if (!Number.isInteger(q.level) || q.level < 1 || q.level > LEVEL_COUNT) fail(where, `level must be 1–${LEVEL_COUNT}`);
    if (!isText(q.question, 1000)) fail(where, 'question text is required');
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) fail(where, 'needs 2–6 options');
    else {
      if (q.options.some((o) => !isText(o, 300))) fail(where, 'options must be non-empty strings');
      if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== q.options.length) fail(where, 'duplicate options');
      if (!q.options.includes(q.correctAnswer)) fail(where, `correctAnswer "${q.correctAnswer}" is not exactly one of the options`);
    }
    const key = `${q.subjectId}|${q.level}|${String(q.question).trim().toLowerCase()}`;
    if (seenText.has(key)) fail(where, `same question text as ${seenText.get(key)} in this level`);
    seenText.set(key, where);
  });

  // ── Quiz (True / False) statements ──
  const seenStatement = new Map();
  const balance = new Map();
  trueFalseQuestions.forEach(({ id, source, answer, data: q }) => {
    const where = `${source} (${id})`;
    if (!subjectIds.has(q.subjectId)) fail(where, `unknown subjectId "${q.subjectId}"`);
    if (!Number.isInteger(q.level) || q.level < 1 || q.level > LEVEL_COUNT) fail(where, `level must be 1–${LEVEL_COUNT}`);
    if (!isText(q.question, 400)) fail(where, 'statement is required (max 400 characters)');
    else if (/\?\s*$/.test(q.question)) fail(where, 'write a statement, not a question (it ends with "?")');
    if (typeof answer !== 'boolean') fail(where, 'answer must be true or false (JSON boolean, no quotes)');
    if (!isText(q.explanation, 500)) fail(where, 'explanation is required (max 500 characters)');
    const key = `${q.subjectId}|${String(q.question).trim().toLowerCase()}`;
    if (seenStatement.has(key)) fail(where, `same statement as ${seenStatement.get(key)}`);
    seenStatement.set(key, where);
    if (q.isActive && typeof answer === 'boolean') {
      const levelKey = `${q.subjectId}|${q.level}`;
      const b = balance.get(levelKey) ?? { t: 0, f: 0 };
      b[answer ? 't' : 'f'] += 1;
      balance.set(levelKey, b);
    }
  });
  for (const [key, { t, f }] of balance) {
    const total = t + f;
    // A level that is mostly "True" (or "False") can be passed by always tapping the same button.
    if (total >= QUESTIONS_PER_QUIZ && (t < total * 0.3 || f < total * 0.3)) {
      fail(`true-false ${key.replace('|', ' L')}`, `answers are unbalanced (${t} true / ${f} false) — keep each side at least 30%`);
    }
  }

  return problems;
}

/** Per subject + level counts of active questions, for the summary. */
export function coverage({ subjects, questions }) {
  const counts = new Map();
  for (const { data: q } of questions) {
    if (!q.isActive) continue;
    const key = `${q.subjectId}|${q.level}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return subjects.map((s) => {
    const levels = [];
    for (let level = 1; level <= LEVEL_COUNT; level += 1) levels.push({ level, count: counts.get(`${s.id}|${level}`) ?? 0 });
    return { subject: s, levels, playable: levels.filter((l) => l.count >= QUESTIONS_PER_QUIZ).length };
  });
}
