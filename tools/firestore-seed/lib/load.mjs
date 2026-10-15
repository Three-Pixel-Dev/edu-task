import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseCsv } from './csv.mjs';

/**
 * Loads seed content from data/:
 *   subjectFields.json, subjects.json
 *   questions/*.json  — { subjectId, levels: { "1": [ {question, options, correctAnswer, explanation, isActive?} ] } }
 *   questions/*.csv   — subjectId,level,question,option1..option6,correctAnswer,explanation[,isActive]
 *
 *   true-false/*.json — Quiz (True / False) statements → `trueFalseQuestions` collection:
 *                       { subjectId, levels: { "1": [ {statement, answer: true|false, explanation, isActive?} ] } }
 *
 * Question document ids are deterministic: `${subjectId}__l${level}__q${nn}`
 * (Quiz: `${subjectId}__tf__l${level}__q${nn}`; nn = position within that
 * subject + level), so re-running the seed updates questions in place
 * instead of duplicating them.
 */

export const questionId = (subjectId, level, order) => `${subjectId}__l${level}__q${String(order).padStart(2, '0')}`;
export const trueFalseQuestionId = (subjectId, level, order) => `${subjectId}__tf__l${level}__q${String(order).padStart(2, '0')}`;
export const TRUE_FALSE_OPTIONS = ['True', 'False'];

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    throw new Error(`${path.basename(file)}: ${error.message}`);
  }
}

export async function loadSeedData(dataDir) {
  const subjectFields = await readJson(path.join(dataDir, 'subjectFields.json'));
  const subjects = await readJson(path.join(dataDir, 'subjects.json'));

  const questionsDir = path.join(dataDir, 'questions');
  const files = (await readdir(questionsDir)).filter((f) => f.endsWith('.json') || f.endsWith('.csv')).sort();

  /** Raw rows grouped by "subjectId|level", keeping file order. */
  const groups = new Map();
  const add = (source, subjectId, level, q) => {
    const key = `${subjectId}|${level}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...q, subjectId, level, source });
  };

  for (const file of files) {
    const full = path.join(questionsDir, file);
    if (file.endsWith('.json')) {
      const doc = await readJson(full);
      for (const [levelKey, list] of Object.entries(doc.levels ?? {})) {
        if (!Array.isArray(list)) throw new Error(`${file}: level ${levelKey} must be an array`);
        list.forEach((q, i) => add(`${file} L${levelKey} #${i + 1}`, doc.subjectId, Number(levelKey), q));
      }
    } else {
      const rows = parseCsv(await readFile(full, 'utf8'));
      const [header, ...body] = rows;
      const col = (name) => header.indexOf(name);
      for (const required of ['subjectId', 'level', 'question', 'correctAnswer']) {
        if (col(required) < 0) throw new Error(`${file}: missing column "${required}"`);
      }
      const optionCols = header.map((h, i) => (/^option\d+$/.test(h) ? i : -1)).filter((i) => i >= 0);
      body.forEach((row, i) => {
        if (row.every((cell) => cell.trim() === '')) return;
        const isActiveCell = col('isActive') >= 0 ? row[col('isActive')]?.trim().toLowerCase() : '';
        add(`${file} row ${i + 2}`, row[col('subjectId')]?.trim(), Number(row[col('level')]), {
          question: row[col('question')] ?? '',
          options: optionCols.map((c) => (row[c] ?? '').trim()).filter(Boolean),
          correctAnswer: (row[col('correctAnswer')] ?? '').trim(),
          explanation: col('explanation') >= 0 ? (row[col('explanation')] ?? '') : '',
          isActive: isActiveCell === '' ? true : isActiveCell === 'true',
        });
      });
    }
  }

  const questions = [];
  for (const list of groups.values()) {
    list.forEach((q, i) => {
      const order = i + 1;
      questions.push({
        id: questionId(q.subjectId, q.level, order),
        source: q.source,
        data: {
          subjectId: q.subjectId,
          level: q.level,
          question: typeof q.question === 'string' ? q.question.trim() : q.question,
          options: q.options,
          correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer.trim() : q.correctAnswer,
          explanation: typeof q.explanation === 'string' ? q.explanation.trim() : '',
          order,
          isActive: q.isActive !== false,
        },
      });
    });
  }

  const trueFalseQuestions = await loadTrueFalse(path.join(dataDir, 'true-false'));
  return { subjectFields, subjects, questions, trueFalseQuestions };
}

/** Quiz (True / False) statements. The folder is optional while the bank is being written. */
async function loadTrueFalse(dir) {
  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const groups = new Map();
  for (const file of files) {
    const doc = await readJson(path.join(dir, file));
    for (const [levelKey, list] of Object.entries(doc.levels ?? {})) {
      if (!Array.isArray(list)) throw new Error(`true-false/${file}: level ${levelKey} must be an array`);
      const key = `${doc.subjectId}|${levelKey}`;
      if (!groups.has(key)) groups.set(key, []);
      list.forEach((q, i) => groups.get(key).push({ ...q, subjectId: doc.subjectId, level: Number(levelKey), source: `true-false/${file} L${levelKey} #${i + 1}` }));
    }
  }
  const out = [];
  for (const list of groups.values()) {
    list.forEach((q, i) => {
      const order = i + 1;
      out.push({
        id: trueFalseQuestionId(q.subjectId, q.level, order),
        source: q.source,
        answer: q.answer,
        data: {
          subjectId: q.subjectId,
          level: q.level,
          question: typeof q.statement === 'string' ? q.statement.trim() : q.statement,
          options: [...TRUE_FALSE_OPTIONS],
          correctAnswer: q.answer === true ? 'True' : q.answer === false ? 'False' : '',
          explanation: typeof q.explanation === 'string' ? q.explanation.trim() : '',
          order,
          isActive: q.isActive !== false,
        },
      });
    });
  }
  return out;
}
