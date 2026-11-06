#!/usr/bin/env node
/**
 * Drafts Quiz (True / False) statements from concept banks (docs/true-false-question-plan.md §2–4).
 *
 *   node generate-true-false.mjs              # write all 35 subjects
 *   node generate-true-false.mjs --only database-management-system,operating-system
 *   node generate-true-false.mjs --dry-run    # print counts only
 *
 * Mapping: concepts 1–10 → levels 1,6,11 · 11–20 → 2,7,12 · … · 41–50 → 5,10,15
 * Styles:  levels 1–5 recall · 6–10 understand · 11–15 apply
 * Each level gets 10 statements (one per concept in the band), balanced 5 true / 5 false.
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const bankDir = path.join(here, 'bank');
const outDir = path.join(here, 'data', 'true-false');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const onlyArg = (() => {
  const i = args.indexOf('--only');
  return i >= 0 ? new Set(args[i + 1].split(',').map((s) => s.trim()).filter(Boolean)) : null;
})();

const LEVEL_BANDS = [
  { conceptStart: 0, levels: { recall: 1, understand: 6, apply: 11 } },
  { conceptStart: 10, levels: { recall: 2, understand: 7, apply: 12 } },
  { conceptStart: 20, levels: { recall: 3, understand: 8, apply: 13 } },
  { conceptStart: 30, levels: { recall: 4, understand: 9, apply: 14 } },
  { conceptStart: 40, levels: { recall: 5, understand: 10, apply: 15 } },
];

function clip(text, max = 400) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}.`;
}

function ensureStatement(text) {
  let s = clip(text, 400).replace(/\?+\s*$/, '.').trim();
  if (!/[.!?]$/.test(s)) s = `${s}.`;
  // Statement must not end with "?"
  s = s.replace(/\?\s*$/, '.');
  return s;
}

function ensureExplanation(text) {
  let s = clip(text, 500);
  if (s.length < 10) s = `${s} This matches the standard definition of the concept.`;
  return s.slice(0, 500);
}

function articleTerm(term) {
  const t = String(term).trim();
  if (/^(a|an|the)\s/i.test(t)) return t;
  if (/^[AEIOUaeiou]/.test(t)) return `An ${t}`;
  return `A ${t}`;
}

function lowerFirst(s) {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function stripTrailingPeriod(s) {
  return String(s).replace(/[.]\s*$/, '').trim();
}

function pickWrong(concept, i = 0) {
  const list = [...(concept.wrongs ?? []), ...(concept.scenarioWrongs ?? [])].filter(Boolean);
  if (!list.length) return 'an unrelated database object';
  return list[i % list.length];
}

function makeRecall(concept, wantTrue, salt) {
  const term = concept.term;
  const def = stripTrailingPeriod(concept.definition);
  if (wantTrue) {
    return {
      statement: ensureStatement(`${articleTerm(term)} is ${lowerFirst(def)}`),
      answer: true,
      explanation: ensureExplanation(concept.why || `${articleTerm(term)} ${lowerFirst(def)}.`),
    };
  }
  const wrong = stripTrailingPeriod(pickWrong(concept, salt));
  return {
    statement: ensureStatement(`${articleTerm(term)} is ${lowerFirst(wrong)}`),
    answer: false,
    explanation: ensureExplanation(concept.why || `Correct: ${articleTerm(term)} is ${lowerFirst(def)}.`),
  };
}

function makeUnderstand(concept, wantTrue, salt) {
  const example = stripTrailingPeriod(concept.example);
  const term = concept.term;
  if (wantTrue) {
    // Prefer a factual recognition sentence tied to the example.
    return {
      statement: ensureStatement(example),
      answer: true,
      explanation: ensureExplanation(concept.why || `${articleTerm(term)} matches this example.`),
    };
  }
  const wrong = stripTrailingPeriod(pickWrong(concept, salt + 1));
  // Plausible false: attach the wrong idea to the same example framing.
  return {
    statement: ensureStatement(`In standard textbooks, ${lowerFirst(wrong)} is called ${term}`),
    answer: false,
    explanation: ensureExplanation(
      concept.why || `Correct: ${articleTerm(term)} is ${lowerFirst(stripTrailingPeriod(concept.definition))}.`,
    ),
  };
}

function makeApply(concept, wantTrue, salt) {
  const scenario = stripTrailingPeriod(concept.scenario);
  const answer = stripTrailingPeriod(concept.scenarioAnswer);
  const why = concept.scenarioWhy || concept.why || '';
  if (wantTrue) {
    // Turn "What is X?" scenario into a statement with the correct outcome.
    const stem = scenario
      .replace(/\?\s*$/, '')
      .replace(/\bWhat (is|are|does|do|must|should|would|can|will)\b/i, 'In this case')
      .replace(/\bWhich\b/i, 'The')
      .trim();
    let statement;
    if (/^In this case/i.test(stem) || /the case|this situation|this design/i.test(stem)) {
      statement = `${stem}: ${answer}`;
    } else if (scenario.includes('?')) {
      statement = `When ${lowerFirst(stem)}, the correct result is ${lowerFirst(answer)}`;
    } else {
      statement = `${stem}. The correct outcome is ${lowerFirst(answer)}`;
    }
    return {
      statement: ensureStatement(statement),
      answer: true,
      explanation: ensureExplanation(why || `${articleTerm(concept.term)}: ${stripTrailingPeriod(concept.definition)}.`),
    };
  }
  const wrong = stripTrailingPeriod((concept.scenarioWrongs ?? [])[salt % Math.max((concept.scenarioWrongs ?? []).length, 1)] || pickWrong(concept, salt));
  const stem = scenario.replace(/\?\s*$/, '').trim();
  return {
    statement: ensureStatement(`When ${lowerFirst(stem)}, the correct result is ${lowerFirst(wrong)}`),
    answer: false,
    explanation: ensureExplanation(why || `Correct outcome: ${answer}. ${stripTrailingPeriod(concept.definition)}.`),
  };
}

function wantTrueFor(levelStyle, conceptIndexInBand) {
  // 5 true / 5 false per level of 10. Rotate which slots are false by style
  // so the same concept is not always false across recall/understand/apply.
  const falseSlots =
    levelStyle === 'recall'
      ? new Set([1, 3, 5, 7, 9])
      : levelStyle === 'understand'
        ? new Set([0, 2, 4, 6, 8])
        : new Set([0, 1, 4, 5, 8]);
  return !falseSlots.has(conceptIndexInBand);
}

function buildSubject(subjectId, concepts) {
  if (concepts.length < 50) {
    throw new Error(`${subjectId}: bank has ${concepts.length} concepts, need 50`);
  }

  const levels = {};
  for (let level = 1; level <= 15; level += 1) levels[String(level)] = [];

  const seen = new Set();
  const push = (level, item) => {
    const key = item.statement.trim().toLowerCase();
    if (seen.has(key)) {
      // Soft uniquify without changing meaning too much.
      item = {
        ...item,
        statement: ensureStatement(`${item.statement.replace(/[.]\s*$/, '')} (${subjectId.split('-').slice(0, 2).join(' ')})`),
      };
    }
    seen.add(item.statement.trim().toLowerCase());
    levels[String(level)].push({
      statement: item.statement,
      answer: item.answer,
      explanation: item.explanation,
    });
  };

  for (const band of LEVEL_BANDS) {
    for (let i = 0; i < 10; i += 1) {
      const concept = concepts[band.conceptStart + i];
      const salt = band.conceptStart + i;
      push(band.levels.recall, makeRecall(concept, wantTrueFor('recall', i), salt));
      push(band.levels.understand, makeUnderstand(concept, wantTrueFor('understand', i), salt));
      push(band.levels.apply, makeApply(concept, wantTrueFor('apply', i), salt));
    }
  }

  return { subjectId, levels };
}

async function main() {
  const files = (await readdir(bankDir)).filter((f) => f.endsWith('.json')).sort();
  await mkdir(outDir, { recursive: true });

  let total = 0;
  const written = [];
  for (const file of files) {
    const subjectId = file.replace(/\.json$/, '');
    if (onlyArg && !onlyArg.has(subjectId)) continue;
    const concepts = JSON.parse(await readFile(path.join(bankDir, file), 'utf8'));
    const doc = buildSubject(subjectId, concepts);
    const count = Object.values(doc.levels).reduce((n, list) => n + list.length, 0);
    total += count;
    written.push({ subjectId, count });
    if (!dryRun) {
      const outPath = path.join(outDir, `${subjectId}.json`);
      await writeFile(outPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    }
  }

  console.log(dryRun ? 'Dry run — nothing written.' : `Wrote ${written.length} files to ${outDir}`);
  for (const row of written) console.log(`  ${row.subjectId.padEnd(36)} ${row.count}`);
  console.log(`Total statements: ${total}`);
  if (!dryRun) {
    console.log('\nNext: cd tools/firestore-seed && npm run validate');
    console.log('Then: npm run seed -- --project <id>');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
