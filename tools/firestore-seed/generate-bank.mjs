#!/usr/bin/env node
/**
 * Builds data/questions/<subjectId>.json from bank/<subjectId>.json.
 * Each bank file is an array of 50 concepts. Levels that already have 10
 * valid questions in data/questions are kept as they are.
 *
 *   node generate-bank.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const bankDir = path.join(here, 'bank');
const outDir = path.join(here, 'data', 'questions');

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle(items, seedText) {
  const rand = mulberry32(hash(seedText));
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clean(value) {
  return String(value ?? '').trim();
}

function asQuestion(question, options, correctAnswer, explanation) {
  return {
    question: clean(question),
    options: options.map(clean),
    correctAnswer: clean(correctAnswer),
    explanation: clean(explanation),
  };
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

function existingLevels(doc) {
  const kept = {};
  for (const [levelKey, list] of Object.entries(doc?.levels ?? {})) {
    if (!Array.isArray(list) || list.length < 10) continue;
    kept[levelKey] = list.slice(0, 10).map((q) => asQuestion(q.question, q.options, q.correctAnswer, q.explanation));
  }
  return kept;
}

function buildLevels(subjectId, concepts) {
  if (!Array.isArray(concepts) || concepts.length !== 50) {
    throw new Error(`${subjectId}: bank must contain exactly 50 concepts`);
  }
  concepts.forEach((c, i) => {
    const where = `${subjectId} concept ${i + 1}`;
    for (const key of ['term', 'definition', 'why', 'example', 'scenario', 'scenarioAnswer', 'scenarioWhy']) {
      if (!clean(c[key])) throw new Error(`${where}: missing ${key}`);
    }
    if (!Array.isArray(c.wrongs) || c.wrongs.length !== 3) throw new Error(`${where}: wrongs must have 3 items`);
    if (!Array.isArray(c.scenarioWrongs) || c.scenarioWrongs.length !== 3) throw new Error(`${where}: scenarioWrongs must have 3 items`);
  });

  const levels = {};
  for (let level = 1; level <= 15; level += 1) {
    const band = level <= 5 ? 'recall' : level <= 10 ? 'understand' : 'apply';
    const start = ((level - 1) % 5) * 10;
    const slice = concepts.slice(start, start + 10);
    levels[String(level)] = slice.map((c, i) => {
      if (band === 'recall') {
        return asQuestion(
          `What is ${c.term}?`,
          shuffle([c.definition, ...c.wrongs], `${subjectId}|${level}|${i}|recall`),
          c.definition,
          c.why,
        );
      }
      if (band === 'understand') {
        const distractors = [];
        for (let k = 1; distractors.length < 3 && k < concepts.length; k += 1) {
          const other = concepts[(start + i + k) % concepts.length].example;
          if (clean(other).toLowerCase() !== clean(c.example).toLowerCase() && !distractors.some((d) => d.toLowerCase() === clean(other).toLowerCase())) {
            distractors.push(other);
          }
        }
        if (distractors.length < 3) throw new Error(`${subjectId}: not enough distinct examples for ${c.term}`);
        return asQuestion(
          `Which situation illustrates ${c.term}?`,
          shuffle([c.example, ...distractors], `${subjectId}|${level}|${i}|understand`),
          c.example,
          c.why,
        );
      }
      return asQuestion(
        c.scenario,
        shuffle([c.scenarioAnswer, ...c.scenarioWrongs], `${subjectId}|${level}|${i}|apply`),
        c.scenarioAnswer,
        c.scenarioWhy,
      );
    });
  }
  return levels;
}

async function main() {
  const files = (await readdir(bankDir)).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) throw new Error('No bank files found');
  for (const file of files) {
    const subjectId = file.replace(/\.json$/, '');
    const concepts = await readJson(path.join(bankDir, file));
    const levels = buildLevels(subjectId, concepts);
    const outFile = path.join(outDir, file);
    let kept = {};
    try {
      kept = existingLevels(await readJson(outFile));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const merged = { ...levels, ...kept };
    await writeFile(outFile, `${JSON.stringify({ subjectId, levels: merged }, null, 2)}\n`, 'utf8');
    const keptLevels = Object.keys(kept).sort((a, b) => Number(a) - Number(b)).join(',') || 'none';
    console.log(`${subjectId}: wrote 15 levels (kept existing: ${keptLevels})`);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
