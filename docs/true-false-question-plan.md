# Plan: 5,250 Quiz (True / False) statements

The app already supports the **Quiz** type end to end: tab, flow, scoring, results, history, rules, indexes and seed tool. This plan covers the content only: **5,250 true-or-false statements**, the same size as the Multiple choice bank.

| | |
| --- | --- |
| Subjects | 35 (all fields and subject codes from the CEIT subject code sheet) |
| Levels per subject | 15 |
| Statements per level | 10 (exactly what one attempt shows) |
| **Total** | **35 × 15 × 10 = 5,250** |
| Already written | **5,250** drafted from concept banks (`generate-true-false.mjs`); still needs peer review of false statements |
| Delivery | Bundled in the app (`src/data/true-false/` via `npm run sync:true-false`) — not seeded to Firestore |
| Source files | `tools/firestore-seed/data/true-false/<subjectId>.json` (one file per subject) |

## 1. File format

```json
{
  "subjectId": "operating-system",
  "levels": {
    "1": [
      {
        "statement": "A process is a program in execution.",
        "answer": true,
        "explanation": "A program is passive code on disk; a process is that code running, with its own state and resources."
      }
    ]
  }
}
```

- `subjectId` must match `data/subjects.json` exactly, e.g. `research-methodology`, not `research-methodology-statistics`.
- `answer` is a JSON boolean: `true` or `false`, with no quotes.
- An optional `"isActive": false` hides a statement without deleting it.
- `sync-true-false-to-app.mjs` maps each statement to `{ question, options: ["True", "False"], correctAnswer: "True" | "False", explanation, level, order, isActive }`. Stable ids are `<subjectId>__tf__l<level>__q<nn>` (used in sessions/results).

## 2. What each level covers

Each level reuses the **same 10 concepts** as the matching Multiple choice level, from the subject's concept bank `tools/firestore-seed/bank/<subjectId>.json`, which has 50 concepts per subject. Writers don't need to invent a syllabus, and a student who studies one level gets both question types on the same topics.

**Which concepts each level uses:**

| Concepts (bank index) | Levels |
| --- | --- |
| 1–10 | 1, 6, 11 |
| 11–20 | 2, 7, 12 |
| 21–30 | 3, 8, 13 |
| 31–40 | 4, 9, 14 |
| 41–50 | 5, 10, 15 |

**What kind of statement each band uses:**

| Levels | Style | Example (DBMS) |
| --- | --- | --- |
| 1–5 · Recall | One definition or fact | "A primary key column may contain NULL values." → **False** |
| 6–10 · Understand | Recognise an example, a cause or a comparison | "Storing a customer's address in two tables is an example of data redundancy." → **True** |
| 11–15 · Apply | A short scenario with one correct outcome | "If a transaction commits and the server then crashes, the committed changes are lost." → **False** |

Each concept therefore gets 3 statements: one recall, one understand and one apply. That gives 50 × 3 = 150 per subject.

## 3. Writing rules (the validator enforces the ones marked ✔)

1. ✔ **One statement, not a question.** It must not end with "?".
2. **One idea per statement.** "TCP is reliable and uses port 80" mixes two claims, so split it.
3. **Unambiguously true or false** in standard textbooks. Avoid "usually", "often" and "best", and avoid statements that depend on one vendor's version or on this year's facts.
4. ✔ **Balanced answers.** In every level, each side must be at least 30% (3 of 10). Aim for 5 true and 5 false.
5. **False statements must be plausibly false.** Change one key word (a number, a layer, "LIFO" ↔ "FIFO"), not the whole sentence. Avoid trick wording, double negatives and "never/always" as the only clue.
6. ✔ **The explanation is required (10–500 characters).** For a false statement, it must give the **correct fact**, so the result screen teaches something.
7. ✔ **No duplicates** within a subject, across all 15 levels.
8. Keep a statement at most 400 characters ✔, in plain English for second-language readers, with no Markdown or images. Short inline code is fine: `int *p = &x;`.
9. Don't copy a Multiple choice question word for word. The Quiz should test the concept from a different angle.

## 4. How to produce them

**Option A — written by people, with a draft to start from (recommended).**

1. Run a small script to draft statements from the existing concept bank:
   - The true version is `term` + `definition`, `example` or `scenarioAnswer`.
   - The false version swaps in one of `wrongs` or `scenarioWrongs`.
2. The draft is roughly 70% usable. A person rewrites any statement that sounds awkward, removes the obvious giveaways, writes the explanations for false statements and balances true/false in each level.
3. A second person reviews it, as described in step 5.

Rough effort: about 1–1.5 hours per subject for editing plus 30 minutes for review. That's about 35 subjects × 2 hours ≈ 70 hours. Split across 3–4 people, it takes 1–2 weeks.

**Option B — fully hand-written.** This gives the best quality but takes about 3× longer. Use it for the subjects the lecturer cares most about.

**Option C — generated by AI, then checked by people.** This is fastest, but every statement still needs the review in step 5. Generated statements can be confidently wrong, especially calculations and edge cases.

## 5. Quality checks before seeding

1. `cd tools/firestore-seed && npm run validate`
   - Format, booleans, "?" endings, duplicates and the true/false balance are checked automatically.
   - The **Quiz (true / false) coverage** table shows each subject's progress, e.g. `15/15 playable`.
2. A peer review of **every** false statement: is it really false, and does the explanation give the right fact?
3. A spot check of 10% of the true statements, chosen at random, by a subject lecturer where possible.
4. A playtest of one level per subject in the app, to read the result-screen review the way a student will see it.

## 6. Order of work

1. **Demo subjects first.** DBMS, Operating System, Networking Fundamentals, DSA, Information Security and Software Engineering already have samples and appear in the demo account.
2. The rest of the **Software** and **Network and Communication** fields, which are the most-used subjects.
3. **Security**, **Data Science** and **Signal Processing**.
4. **Electronic & Hardware**.
5. **Project Management & Practice**. These subjects are practice-based (Internship, Thesis, Integrated Design Project), so test real knowledge: report structure, citation styles, research ethics, the design process and planning tools. Avoid opinions.

Seed after each batch. The seed is idempotent, so `npm run seed -- --project <id>` can be re-run safely. Levels with fewer than 10 statements show "Not enough questions are available for this level yet" until they're filled.

## 7. Tracker

The 80 sample statements were written before the concept mapping in section 2. Check them against that mapping when you complete their subjects. Update this table as files are finished. **Done** counts statements that passed `npm run validate` and peer review.

| Field | Code | Subject | `subjectId` | Done | Notes |
| --- | --- | --- | --- | --- | --- |
| Electronic & Hardware | CEIT-1000 | Introduction to Computer Systems | `intro-computer-systems` | 150 / 150 | drafted · needs peer review |
| Electronic & Hardware | CEIT-3010 | Digital Electronics | `digital-electronics` | 150 / 150 | drafted · needs peer review |
| Electronic & Hardware | CEIT-3020 | Engineering Circuit Analysis | `engineering-circuit-analysis` | 150 / 150 | drafted · needs peer review |
| Electronic & Hardware | CEIT-5030 | Computer Organization and Design | `computer-organization-design` | 150 / 150 | drafted · needs peer review |
| Electronic & Hardware | CEIT-6040 | Computer Architecture | `computer-architecture` | 150 / 150 | drafted · needs peer review |
| Electronic & Hardware | CEIT-7050 | Embedded System | `embedded-systems` | 150 / 150 | drafted · needs peer review |
| Software | CEIT-2001 | C Programming | `c-programming` | 150 / 150 | drafted · needs peer review |
| Software | CEIT-3011 | Object Oriented Programming (Using C++) | `object-oriented-programming` | 150 / 150 | drafted · needs peer review |
| Software | CEIT-4021 | Advanced Java Programming | `advanced-java-programming` | 150 / 150 | drafted · needs peer review |
| Software | CEIT-4031 | Database Management System | `database-management-system` | 150 / 150 | drafted · needs peer review |
| Software | CEIT-4041 | Data Structures and Algorithms | `data-structures-algorithms` | 150 / 150 | drafted · needs peer review |
| Software | CEIT-5051 | Operating System | `operating-system` | 150 / 150 | drafted · needs peer review |
| Software | CEIT-5061 | Software Engineering | `software-engineering` | 150 / 150 | drafted · needs peer review |
| Network and Communication | CEIT-4002 | Digital Communications | `digital-communications` | 150 / 150 | drafted · needs peer review |
| Network and Communication | CEIT-5012 | Networking Fundamentals | `networking-fundamentals` | 150 / 150 | drafted · needs peer review |
| Network and Communication | CEIT-6022 | Advanced Networking | `advanced-networking` | 150 / 150 | drafted · needs peer review |
| Network and Communication | CEIT-7032 | Wireless and Mobile Communication | `wireless-mobile-communication` | 150 / 150 | drafted · needs peer review |
| Network and Communication | CEIT-8042 | Cloud Computing | `cloud-computing` | 150 / 150 | drafted · needs peer review |
| Network and Communication | CEIT-8052 | Information Theory | `information-theory` | 150 / 150 | drafted · needs peer review |
| Security | CEIT-6003 | Information Security | `information-security` | 150 / 150 | drafted · needs peer review |
| Security | CEIT-7013 | Cryptography and Network Security | `cryptography-network-security` | 150 / 150 | drafted · needs peer review |
| Security | CEIT-8023 | Computer Forensics | `computer-forensics` | 150 / 150 | drafted · needs peer review |
| Security | CEIT-8033 | Blockchain Technology and Cryptocurrency | `blockchain-cryptocurrency` | 150 / 150 | drafted · needs peer review |
| Data Science | CEIT-6004 | Artificial Intelligence | `artificial-intelligence` | 150 / 150 | drafted · needs peer review |
| Data Science | CEIT-7014 | Data Mining | `data-mining` | 150 / 150 | drafted · needs peer review |
| Data Science | CEIT-8024 | Big Data Analysis | `big-data-analysis` | 150 / 150 | drafted · needs peer review |
| Signal Processing | CEIT-6005 | Signal and Systems | `signals-systems` | 150 / 150 | drafted · needs peer review |
| Signal Processing | CEIT-7015 | Digital Image Processing | `digital-image-processing` | 150 / 150 | drafted · needs peer review |
| Project Management & Practice | CEIT-5006 | Professional Practice in IT | `professional-practice-it` | 150 / 150 | drafted · needs peer review |
| Project Management & Practice | CEIT-7016 | Business IT | `business-it` | 150 / 150 | drafted · needs peer review |
| Project Management & Practice | CEIT-8026 | Project Management | `project-management` | 150 / 150 | drafted · needs peer review |
| Project Management & Practice | CEIT-9036 | Research Methodology & Statistical Analysis | `research-methodology` | 150 / 150 | drafted · needs peer review |
| Project Management & Practice | CEIT-9046 | Internship | `internship` | 150 / 150 | drafted · needs peer review |
| Project Management & Practice | CEIT-9056 | Integrated Design Project | `integrated-design-project` | 150 / 150 | drafted · needs peer review |
| Project Management & Practice | CEIT-10066 | Graduation Thesis | `graduation-thesis` | 150 / 150 | drafted · needs peer review |
| | | | **Total** | **5,250 / 5,250** | drafted · peer review pending |
