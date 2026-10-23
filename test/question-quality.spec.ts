import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

type QuestionRow = {
	id: string;
	topic_id: string;
	subject: string;
	prompt: string;
	options_json: string;
	answer_json: string;
	rationale: string;
	version: number;
};

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

async function activeMcqs(): Promise<QuestionRow[]> {
	const result = await env.DB.prepare(
		`SELECT DISTINCT questions.id, questions.topic_id, assignment_templates.subject,
		        questions.prompt, questions.options_json, questions.answer_json,
		        questions.rationale, questions.version
		 FROM assignment_templates
		 JOIN assignment_template_items ON assignment_template_items.template_id = assignment_templates.id
		 JOIN questions ON questions.id = assignment_template_items.question_id
		 WHERE assignment_templates.active = 1
		   AND assignment_templates.review_status = 'reviewed'
		   AND questions.review_status = 'reviewed'
		   AND questions.question_type = 'single_choice'
		 ORDER BY questions.id`,
	).all<QuestionRow>();
	return result.results;
}

describe('reviewed MCQ quality gate', () => {
	it('requires four unique options and one resolvable answer for every active MCQ', async () => {
		const rows = await activeMcqs();
		expect(rows.length).toBeGreaterThan(300);

		for (const row of rows) {
			const options = JSON.parse(row.options_json) as Array<{ id: string; label: string }>;
			const answer = JSON.parse(row.answer_json) as { choice: string };
			expect(options, row.id).toHaveLength(4);
			expect(new Set(options.map((option) => option.id)).size, row.id).toBe(4);
			expect(new Set(options.map((option) => option.label.trim().toLowerCase())).size, row.id).toBe(4);
			expect(
				options.some((option) => option.id === answer.choice),
				row.id,
			).toBe(true);
			expect(row.rationale.trim().length, row.id).toBeGreaterThanOrEqual(35);
		}
	});

	it('requires an independently recorded solution check for every active MCQ', async () => {
		const rows = await env.DB.prepare(
			`SELECT questions.id, questions.options_json, questions.answer_json,
			        question_solution_checks.expected_answer_text,
			        question_solution_checks.verification_method,
			        question_solution_checks.verification_notes,
			        question_solution_checks.status
			 FROM assignment_templates
			 JOIN assignment_template_items ON assignment_template_items.template_id = assignment_templates.id
			 JOIN questions ON questions.id = assignment_template_items.question_id
			 LEFT JOIN question_solution_checks ON question_solution_checks.question_id = questions.id
			 WHERE assignment_templates.active = 1
			   AND assignment_templates.review_status = 'reviewed'
			   AND questions.review_status = 'reviewed'
			   AND questions.question_type = 'single_choice'
			 ORDER BY questions.id`,
		).all<{
			id: string;
			options_json: string;
			answer_json: string;
			expected_answer_text: string | null;
			verification_method: string | null;
			verification_notes: string | null;
			status: string | null;
		}>();

		for (const row of rows.results) {
			const options = JSON.parse(row.options_json) as Array<{ id: string; label: string }>;
			const answer = JSON.parse(row.answer_json) as { choice: string };
			const selected = options.find((option) => option.id === answer.choice);
			expect(row.status, row.id).toBe('verified');
			expect(row.verification_method, row.id).toMatch(/^(calculation|concept_check|source_check)$/);
			expect(row.verification_notes?.trim().length ?? 0, row.id).toBeGreaterThanOrEqual(20);
			expect(row.expected_answer_text, row.id).toBe(selected?.label);
		}
	});

	it('keeps Chemistry distractors inside the question topic and removes generic chapter-recognition prompts', async () => {
		const chemistry = (await activeMcqs()).filter((row) => row.subject === 'Chemistry');
		expect(chemistry).toHaveLength(105);
		expect(chemistry.every((row) => row.version === 2)).toBe(true);
		expect(chemistry.every((row) => !row.prompt.startsWith('Which statement correctly describes'))).toBe(true);

		const correctAnswerTopics = new Map<string, Set<string>>();
		for (const row of chemistry) {
			const options = JSON.parse(row.options_json) as Array<{ id: string; label: string }>;
			const answer = JSON.parse(row.answer_json) as { choice: string };
			const correct = options.find((option) => option.id === answer.choice)?.label;
			expect(correct, row.id).toBeTruthy();
			const topics = correctAnswerTopics.get(correct!) ?? new Set<string>();
			topics.add(row.topic_id);
			correctAnswerTopics.set(correct!, topics);
		}

		for (const row of chemistry) {
			const options = JSON.parse(row.options_json) as Array<{ id: string; label: string }>;
			const answer = JSON.parse(row.answer_json) as { choice: string };
			for (const distractor of options.filter((option) => option.id !== answer.choice)) {
				const sourceTopics = correctAnswerTopics.get(distractor.label) ?? new Set<string>();
				expect(
					[...sourceTopics].filter((topicId) => topicId !== row.topic_id),
					`${row.id}: ${distractor.label}`,
				).toHaveLength(0);
			}
		}
	});

	it('uses the Product Concept for a quality-led product-improvement philosophy', async () => {
		const row = await env.DB.prepare(
			`SELECT questions.options_json, questions.answer_json
			 FROM assignment_templates
			 JOIN assignment_template_items ON assignment_template_items.template_id = assignment_templates.id
			 JOIN questions ON questions.id = assignment_template_items.question_id
			 WHERE assignment_templates.id = 'template-xii-commerce-marketing-concept-functions-v2'
			   AND assignment_template_items.position = 1
			   AND assignment_templates.active = 1`,
		).first<{ options_json: string; answer_json: string }>();
		expect(row).not.toBeNull();
		const options = JSON.parse(row!.options_json) as Array<{ id: string; label: string }>;
		const answer = JSON.parse(row!.answer_json) as { choice: string };
		expect(options.find((option) => option.id === answer.choice)?.label).toBe('The Product Concept');
	});
});
