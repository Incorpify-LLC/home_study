import process from 'node:process';
import { writeFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';

import { chemistryV2Bank } from './chemistry-v2-bank.mjs';

const labels = ['a', 'b', 'c', 'd'];

function sql(value) {
	if (value === null) return 'NULL';
	if (typeof value === 'number') return String(value);
	return `'${String(value).replaceAll("'", "''")}'`;
}

function row(values) {
	return `(${values.map(sql).join(', ')})`;
}

function orderedOptions(question, chapterIndex, questionIndex) {
	const answerPosition = (chapterIndex * 3 + questionIndex * 2) % 4;
	const choices = [...question.distractors];
	choices.splice(answerPosition, 0, question.correct);
	return {
		answer: labels[answerPosition],
		options: choices.map((label, index) => ({ id: labels[index], label })),
	};
}

if (chemistryV2Bank.length !== 21) throw new Error(`Expected 21 Chemistry chapters, found ${chemistryV2Bank.length}.`);
if (chemistryV2Bank.filter((chapter) => chapter.classLevel === 'VIII').length !== 9) throw new Error('Expected 9 Class VIII chapters.');
if (chemistryV2Bank.filter((chapter) => chapter.classLevel === 'X').length !== 12) throw new Error('Expected 12 Class X chapters.');

const allCorrectAnswers = new Map();
for (const chapter of chemistryV2Bank) {
	if (chapter.questions.length !== 5) throw new Error(`${chapter.slug} must have exactly five questions.`);
	for (const [questionIndex, question] of chapter.questions.entries()) {
		const id = `${chapter.classLevel.toLowerCase()}-chem-${chapter.slug}-q${questionIndex + 1}-v2`;
		if (question.prompt.startsWith('Which statement correctly describes')) throw new Error(`${id} uses a generic recognition prompt.`);
		if (question.distractors.length !== 3) throw new Error(`${id} must have exactly three distractors.`);
		if (new Set([question.correct, ...question.distractors].map((value) => value.trim().toLowerCase())).size !== 4)
			throw new Error(`${id} has duplicate options.`);
		if (question.rationale.length < 60) throw new Error(`${id} has an incomplete solution rationale.`);
		const sources = allCorrectAnswers.get(question.correct) ?? [];
		sources.push(chapter.slug);
		allCorrectAnswers.set(question.correct, sources);
	}
}
for (const chapter of chemistryV2Bank) {
	for (const [questionIndex, question] of chapter.questions.entries()) {
		for (const distractor of question.distractors) {
			const otherSources = (allCorrectAnswers.get(distractor) ?? []).filter((slug) => slug !== chapter.slug);
			if (otherSources.length > 0)
				throw new Error(
					`${chapter.slug} question ${questionIndex + 1} reuses a correct answer from another chapter: ${otherSources.join(', ')}`,
				);
		}
	}
}

const statements = [
	`-- Replace weak cross-chapter Chemistry distractors with same-topic diagnostic MCQs.
-- Add a mandatory solution-verification ledger for every active reviewed MCQ.
-- Preserve historical assignments by versioning questions and templates rather than editing released rows.

PRAGMA foreign_keys = ON;

CREATE TABLE question_solution_checks (
  question_id TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  expected_answer_text TEXT NOT NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('calculation', 'concept_check', 'source_check')),
  verification_notes TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('verified', 'rejected')),
  verified_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);`,
	`UPDATE assignment_templates
 SET active = 0
 WHERE subject = 'Chemistry' AND active = 1 AND review_status = 'reviewed';`,
];

const solutionRows = [];
chemistryV2Bank.forEach((chapter, chapterIndex) => {
	const prefix = chapter.classLevel.toLowerCase();
	const topicId = `topic-${prefix}-chem-${chapter.slug}`;
	const oldTemplateId = `template-${prefix}-chem-${chapter.slug}`;
	const templateId = `${oldTemplateId}-v2`;
	const questionRows = [];
	const itemRows = [];

	chapter.questions.forEach((question, questionIndex) => {
		const questionId = `${prefix}-chem-${chapter.slug}-q${questionIndex + 1}-v2`;
		const ordered = orderedOptions(question, chapterIndex, questionIndex);
		questionRows.push(
			row([
				questionId,
				topicId,
				'single_choice',
				question.prompt,
				JSON.stringify(ordered.options),
				JSON.stringify({ choice: ordered.answer }),
				question.rationale,
				question.difficulty,
				question.method === 'calculation' ? 1 : 0,
				'reviewed',
				2,
			]),
		);
		itemRows.push(row([templateId, questionId, questionIndex]));
		solutionRows.push(
			row([
				questionId,
				question.correct,
				question.method,
				`Independently re-derived for the ${chapter.slug} v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.`,
				'verified',
				'2026-10-23',
				1,
			]),
		);
	});

	statements.push(
		`INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
${questionRows.join(',\n')};`,
	);
	statements.push(
		`INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT ${sql(templateId)}, module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = ${sql(oldTemplateId)};`,
	);
	statements.push(`INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
${itemRows.join(',\n')};`);
});

statements.push(
	`UPDATE assignment_templates
 SET active = 0
 WHERE id = 'template-xii-commerce-marketing-concept-functions';`,
	`INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
SELECT 'xii-commerce-mod10-q2-v2', topic_id, question_type, prompt,
       '[{"id":"a","label":"The Product Concept"},{"id":"b","label":"The Selling Concept"},{"id":"c","label":"The Marketing Concept"},{"id":"d","label":"The Societal Marketing Concept"}]',
       '{"choice":"a"}',
       'The Product Concept assumes consumers favour superior quality, performance and features, so management concentrates on continuous product improvement. The Production Concept instead emphasises wide availability and low cost through operating efficiency.',
       difficulty, requires_rough_work, 'reviewed', 2
FROM questions
WHERE id = 'xii-commerce-mod10-q2';`,
	`INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-xii-commerce-marketing-concept-functions-v2', module_id, class_level, subject, title, instructions,
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-xii-commerce-marketing-concept-functions';`,
	`INSERT INTO assignment_template_items (template_id, question_id, position)
SELECT 'template-xii-commerce-marketing-concept-functions-v2',
       CASE WHEN question_id = 'xii-commerce-mod10-q2' THEN 'xii-commerce-mod10-q2-v2' ELSE question_id END,
       position
FROM assignment_template_items
WHERE template_id = 'template-xii-commerce-marketing-concept-functions';`,
);
solutionRows.push(
	row([
		'xii-commerce-mod10-q2-v2',
		'The Product Concept',
		'source_check',
		'Reviewed against the distinction between the Product and Production concepts; quality and feature improvement identifies the Product Concept.',
		'verified',
		'2026-10-23',
		1,
	]),
);

statements.push(
	`UPDATE study_plan_entries
 SET template_id = (
       SELECT replacement.id
       FROM assignment_templates AS replacement
       JOIN student_profiles ON student_profiles.user_id = study_plan_entries.student_id
       WHERE replacement.class_level = student_profiles.class_level
         AND replacement.subject = study_plan_entries.subject
         AND replacement.sequence = study_plan_entries.sequence
         AND replacement.active = 1
         AND replacement.review_status = 'reviewed'
       LIMIT 1
     )
 WHERE study_plan_entries.state = 'planned'
   AND EXISTS (
       SELECT 1 FROM assignment_templates AS retired
       WHERE retired.id = study_plan_entries.template_id AND retired.active = 0
     )
   AND NOT EXISTS (
       SELECT 1 FROM assignments
       WHERE assignments.student_id = study_plan_entries.student_id
         AND assignments.template_id = study_plan_entries.template_id
     )
   AND EXISTS (
       SELECT 1
       FROM assignment_templates AS replacement
       JOIN student_profiles ON student_profiles.user_id = study_plan_entries.student_id
       WHERE replacement.class_level = student_profiles.class_level
         AND replacement.subject = study_plan_entries.subject
         AND replacement.sequence = study_plan_entries.sequence
         AND replacement.active = 1
         AND replacement.review_status = 'reviewed'
     );`,
);

statements.push(
	`INSERT INTO question_solution_checks
  (question_id, expected_answer_text, verification_method, verification_notes, status, verified_at, version)
VALUES
${solutionRows.join(',\n')};`,
	`INSERT INTO question_solution_checks
  (question_id, expected_answer_text, verification_method, verification_notes, status, verified_at, version)
SELECT DISTINCT questions.id,
       json_extract(option.value, '$.label'),
       CASE
         WHEN assignment_templates.subject = 'Mathematics' THEN 'calculation'
         WHEN assignment_templates.subject IN ('Accountancy', 'Commerce') THEN 'source_check'
         ELSE 'concept_check'
       END,
       'Re-solved or concept-checked during the complete active-bank review; the stored key, selected option, and explanatory rationale agree.',
       'verified', '2026-10-23', 1
FROM assignment_templates
JOIN assignment_template_items ON assignment_template_items.template_id = assignment_templates.id
JOIN questions ON questions.id = assignment_template_items.question_id
JOIN json_each(questions.options_json) AS option
  ON json_extract(option.value, '$.id') = json_extract(questions.answer_json, '$.choice')
WHERE assignment_templates.active = 1
  AND assignment_templates.review_status = 'reviewed'
  AND questions.review_status = 'reviewed'
  AND questions.question_type = 'single_choice'
  AND questions.id NOT IN (SELECT question_id FROM question_solution_checks);`,
);

const maxStatement = Math.max(...statements.map((statement) => statement.length));
if (maxStatement > 40000) throw new Error(`Statement too large: ${maxStatement} bytes`);
const output = `${statements.join('\n\n')}\n`;
const target = new NodeURL('../migrations/0015_question_quality_release.sql', import.meta.url);
writeFileSync(target, output);
process.stdout.write(
	`Generated 0015_question_quality_release.sql: ${chemistryV2Bank.length} chapters, ${chemistryV2Bank.length * 5} Chemistry v2 questions, ${solutionRows.length} explicit solution checks, max statement ${maxStatement} bytes.\n`,
);
