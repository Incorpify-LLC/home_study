# Question bank quality audit

Audit date: 2026-10-23

## Scope

Every active reviewed single-choice question for the family curriculum was re-read with its keyed answer and explanatory rationale. The audit covered 317 MCQs:

- Class VIII Chemistry: 45
- Class VIII Mathematics: 27
- Class VIII Physics: 25
- Class X Chemistry: 60
- Class X Mathematics: 42
- Class X Physics: 36
- Class XII Accountancy: 26
- Class XII Commerce: 56

The audit did not inspect private learner attempts, scores, names, or account data.

## Findings and corrections

### Chemistry

All 105 Chemistry questions used unrelated chapters as the source of their three distractors. The complete Class VIII and Class X Chemistry banks were replaced with version 2 questions. Each replacement:

- tests one named concept or application from its own chapter;
- uses three same-topic misconception-based distractors;
- provides four unique options and exactly one resolvable key;
- includes a worked explanation;
- avoids the generic “Which statement correctly describes this chapter?” pattern;
- preserves old questions and templates for historical assignments;
- moves untouched planned calendar entries to v2 using the plan's curriculum class, while leaving in-progress assignments on their original version.

### Mathematics

All 69 active Mathematics MCQs were recalculated from their prompts and rationales. Their keys and solutions agreed. Distractors generally represent sign errors, formula errors, incorrect constructions, or nearby numerical results. No content correction was required.

### Physics

All 61 active Physics MCQs were checked against the mechanism, formula, units, and explanation stated in the solution. Their keys and solutions agreed. Distractors remain inside the tested physical concept. No content correction was required.

### Accountancy

All 26 active Accountancy MCQs were checked for account classification, journal treatment, statutory rule, formula, and keyed explanation. Their keys and solutions agreed. No content correction was required.

### Commerce

All 56 active Commerce MCQs were checked for definition, scenario classification, statutory statement, and keyed explanation. One answer-key defect was found and corrected through a versioned question and template:

- `xii-commerce-mod10-q2` described superior product quality, performance, features, and continuous improvement but keyed **The Production Concept**.
- The active version now keys **The Product Concept** and explains the distinction from the Production Concept.

## Permanent quality gate

`npm run audit:questions` now validates the active bank. The same test is included in the full `npm run check` suite.

The gate rejects an active reviewed MCQ if:

- it does not contain exactly four options;
- option IDs or option text are duplicated;
- its answer points to a missing option;
- its solution rationale is incomplete;
- it lacks a verified solution-ledger entry;
- the independently recorded expected answer text disagrees with the keyed option;
- the verification method or notes are missing;
- a Chemistry v2 distractor is a canonical answer copied from another Chemistry chapter;
- a Chemistry question uses the previous generic chapter-recognition prompt.

The solution ledger records whether a question was checked by calculation, concept review, or source/rule review. Automated structural checks do not replace subject review; they make that review mandatory and prevent later answer-key or option edits from silently bypassing it.
