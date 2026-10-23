import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

const expectedTitles = {
	VIII: [
		'Matter',
		'Physical and Chemical Changes',
		'Elements, Compounds and Mixtures',
		'Atomic Structure',
		'Language of Chemistry',
		'Chemical Reactions',
		'Hydrogen',
		'Water',
		'Carbon and its Compounds',
	],
	X: [
		'Periodic Table, Periodic Properties and Variations of Properties',
		'Chemical Bonding',
		'Acids, Bases and Salts',
		'Analytical Chemistry',
		'Mole Concept and Stoichiometry',
		'Electrolysis',
		'Metallurgy',
		'Hydrogen Chloride',
		'Ammonia',
		'Nitric Acid',
		'Sulphuric Acid',
		'Organic Chemistry',
	],
} as const;

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe('Chemistry curriculum release', () => {
	for (const classLevel of ['VIII', 'X'] as const) {
		it(`publishes the complete Class ${classLevel} Chemistry course in syllabus order`, async () => {
			const templates = await env.DB.prepare(
				`SELECT title, sequence, estimated_minutes, review_status, active
				 FROM assignment_templates
				 WHERE class_level = ? AND subject = 'Chemistry' AND active = 1
				 ORDER BY sequence`,
			)
				.bind(classLevel)
				.all<{ title: string; sequence: number; estimated_minutes: number; review_status: string; active: number }>();

			expect(templates.results.map((template) => template.title)).toEqual(expectedTitles[classLevel]);
			expect(templates.results.map((template) => template.sequence)).toEqual(expectedTitles[classLevel].map((_, index) => index + 1));
			expect(templates.results.every((template) => template.review_status === 'reviewed' && template.active === 1)).toBe(true);
			expect(templates.results.every((template) => template.estimated_minutes >= 35 && template.estimated_minutes <= 60)).toBe(true);
		});

		it(`gives every Class ${classLevel} Chemistry chapter a complete lesson and five reviewed questions`, async () => {
			const chapters = await env.DB.prepare(
				`SELECT assignment_templates.id,
				        length(learning_modules.overview) AS overview_length,
				        learning_modules.key_points_json,
				        learning_modules.worked_example_json,
				        COUNT(assignment_template_items.question_id) AS question_count,
				        SUM(CASE WHEN questions.review_status = 'reviewed' THEN 1 ELSE 0 END) AS reviewed_questions
				 FROM assignment_templates
				 JOIN learning_modules ON learning_modules.id = assignment_templates.module_id
				 JOIN assignment_template_items ON assignment_template_items.template_id = assignment_templates.id
				 JOIN questions ON questions.id = assignment_template_items.question_id
				 WHERE assignment_templates.class_level = ? AND assignment_templates.subject = 'Chemistry'
				   AND assignment_templates.active = 1
				 GROUP BY assignment_templates.id, learning_modules.overview, learning_modules.key_points_json,
				          learning_modules.worked_example_json
				 ORDER BY assignment_templates.sequence`,
			)
				.bind(classLevel)
				.all<{
					id: string;
					overview_length: number;
					key_points_json: string;
					worked_example_json: string;
					question_count: number;
					reviewed_questions: number;
				}>();

			expect(chapters.results).toHaveLength(expectedTitles[classLevel].length);
			for (const chapter of chapters.results) {
				expect(chapter.overview_length, chapter.id).toBeGreaterThan(450);
				expect(JSON.parse(chapter.key_points_json), chapter.id).toHaveLength(4);
				const worked = JSON.parse(chapter.worked_example_json) as { prompt: string; steps: string[]; answer: string };
				expect(worked.prompt.length, chapter.id).toBeGreaterThan(20);
				expect(worked.steps.length, chapter.id).toBeGreaterThanOrEqual(3);
				expect(worked.answer.length, chapter.id).toBeGreaterThan(2);
				expect(chapter.question_count, chapter.id).toBe(5);
				expect(chapter.reviewed_questions, chapter.id).toBe(5);
			}
		});
	}

	it('links every Chemistry topic to the official CISCE scope', async () => {
		const rows = await env.DB.prepare(
			`SELECT curriculum_topics.class_level, COUNT(*) AS topic_count,
			        SUM(CASE WHEN curriculum_sources.source_kind = 'official_curriculum'
			                  AND curriculum_topic_sources.relationship = 'authoritative_scope' THEN 1 ELSE 0 END) AS authoritative_count
			 FROM curriculum_topics
			 JOIN curriculum_topic_sources ON curriculum_topic_sources.topic_id = curriculum_topics.id
			 JOIN curriculum_sources ON curriculum_sources.id = curriculum_topic_sources.source_id
			 WHERE curriculum_topics.subject = 'Chemistry'
			 GROUP BY curriculum_topics.class_level`,
		).all<{ class_level: string; topic_count: number; authoritative_count: number }>();

		expect(rows.results).toEqual([
			{ class_level: 'VIII', topic_count: 9, authoritative_count: 9 },
			{ class_level: 'X', topic_count: 12, authoritative_count: 12 },
		]);
	});
});
