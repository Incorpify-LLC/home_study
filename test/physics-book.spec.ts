import { applyD1Migrations, env, SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

// the learner's school-prescribed text: Selina Concise Physics, Part II (Class X),
// "For March 2027 Examination of Class-X". Its chapter list controls how the
// Class X Physics track is grouped and ordered.
const BOOK_CHAPTERS = [
	'Force',
	'Work, Energy and Power',
	'Machines',
	'Refraction of Light at Plane Surfaces',
	'Refraction through a Lens',
	'Spectrum',
	'Sound',
	'Current Electricity',
	'Household Circuits',
	'Electro-magnetism',
	'Calorimetry',
	'Radioactivity',
];

const parentEmail = 'parent-book@example.test';
const studentEmail = 'student-book@example.test';

function accessHeaders(email: string): HeadersInit {
	return { 'cf-access-test-email': email };
}

async function exercisesFor(sequence: number): Promise<{
	title: string;
	lesson: { workedExample: { steps: string[]; answer: string } };
	questions: Array<{ id: string; type: string; prompt: string; correctAnswer: unknown }>;
}> {
	const response = await SELF.fetch(
		`https://study.saneax.in/api/parent/learners/student-book/exercises?subject=Physics&sequence=${sequence}`,
		{ headers: accessHeaders(parentEmail) },
	);
	expect(response.status).toBe(200);
	const body = (await response.json()) as {
		exercise: {
			title: string;
			lesson: { workedExample: { steps: string[]; answer: string } };
			questions: Array<{ id: string; type: string; prompt: string; correctAnswer: unknown }>;
		};
	};
	return body.exercise;
}

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
	await env.DB.batch([
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('parent-book', 'parent', 'Parent Book', ?)`).bind(
			parentEmail,
		),
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('student-book', 'student', 'Student Book', ?)`).bind(
			studentEmail,
		),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-book', 'CISCE', 'X', 2027)`),
		env.DB.prepare(`INSERT INTO parent_students (parent_id, student_id) VALUES ('parent-book', 'student-book')`),
	]);
});

describe('Class X Physics follows the prescribed textbook', () => {
	it('publishes exactly the twelve book chapters in the book order', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/learning/roadmaps', {
			headers: accessHeaders(studentEmail),
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			tracks: Array<{ subject: string; total: number; modules: Array<{ sequence: number; title: string }> }>;
		};
		const physics = body.tracks.find((track) => track.subject === 'Physics');
		expect(physics).toBeDefined();
		expect(physics?.total).toBe(12);
		expect(physics?.modules.map((module) => module.title)).toEqual(BOOK_CHAPTERS);
		expect(physics?.modules.map((module) => module.sequence)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
	});

	it('keeps lens and spectrum as separate chapters, as the book does', async () => {
		const lens = await exercisesFor(5);
		const spectrum = await exercisesFor(6);

		expect(lens.title).toBe('Refraction through a Lens');
		expect(spectrum.title).toBe('Spectrum');

		const lensIds = lens.questions.map((question) => question.id);
		const spectrumIds = spectrum.questions.map((question) => question.id);
		expect(lensIds).toContain('x-physics-lens-q1');
		expect(lensIds).toContain('x-physics-lens-q2');
		expect(lensIds).not.toContain('x-physics-lens-q3');
		expect(spectrumIds).toContain('x-physics-lens-q3');
		expect(spectrumIds).toContain('x-physics-lens-q4');

		expect(spectrum.questions.filter((question) => question.type === 'numeric').length).toBeGreaterThanOrEqual(2);
		expect(spectrum.questions.filter((question) => question.type === 'single_choice').length).toBeGreaterThanOrEqual(2);
		expect(lens.questions.filter((question) => question.type === 'numeric').length).toBeGreaterThanOrEqual(2);
	});

	it('keeps household circuits as its own chapter, apart from current electricity', async () => {
		const current = await exercisesFor(8);
		const household = await exercisesFor(9);

		expect(current.title).toBe('Current Electricity');
		expect(household.title).toBe('Household Circuits');

		const currentIds = current.questions.map((question) => question.id);
		const householdIds = household.questions.map((question) => question.id);
		expect(householdIds).toContain('x-physics-elec-q6');
		expect(householdIds).toContain('x-physics-elec-q4');
		expect(currentIds).not.toContain('x-physics-elec-q6');
		expect(currentIds).toContain('x-physics-elec-q1');
		expect(currentIds).toContain('x-physics-elec-q3');

		expect(current.questions.filter((question) => question.type === 'numeric').length).toBeGreaterThanOrEqual(2);
		expect(household.questions.filter((question) => question.type === 'single_choice').length).toBeGreaterThanOrEqual(2);
		expect(household.questions.length).toBeGreaterThanOrEqual(5);
	});

	it('offers every chapter with a lesson, an answer key and a rationale', async () => {
		for (let sequence = 1; sequence <= 12; sequence += 1) {
			const exercise = await exercisesFor(sequence);
			expect(exercise.title).toBe(BOOK_CHAPTERS[sequence - 1]);
			expect(exercise.questions.length).toBeGreaterThanOrEqual(5);
			for (const question of exercise.questions) {
				expect(question.correctAnswer).not.toBeNull();
				expect(question.prompt.length).toBeGreaterThan(10);
			}
		}
	});

	it('names every Physics topic after its book chapter and keeps the lens sign convention honest', async () => {
		const topics = await env.DB.prepare(`SELECT topic FROM curriculum_topics WHERE class_level = 'X' AND subject = 'Physics'`).all<{
			topic: string;
		}>();
		expect(topics.results.map((row) => row.topic).sort()).toEqual([...BOOK_CHAPTERS].sort());

		const lesson = await exercisesFor(5);
		const steps = lesson.lesson.workedExample;
		const magnificationStep = steps.steps.find((step) => step.includes('Magnification'));
		expect(magnificationStep).toBeDefined();
		// m = v/u with u negative gives a negative magnification, which is what shows inversion.
		expect(magnificationStep).toMatch(/[−-]2/);
		expect(magnificationStep?.toLowerCase()).toContain('inverted');
		expect(steps.answer).toContain('inverted');
	});

	it('records the prescribed textbook as the sequencing reference', async () => {
		const source = await env.DB.prepare(
			`SELECT title, publisher, source_kind, scope_note FROM curriculum_sources WHERE id = 'src-selina-concise-physics-x'`,
		).first<{ title: string; publisher: string; source_kind: string; scope_note: string }>();
		expect(source).not.toBeNull();
		expect(source?.publisher).toContain('Selina');
		expect(source?.source_kind).toBe('supplementary_textbook');
		expect(source?.scope_note).toContain('sequencing');

		const links = await env.DB.prepare(
			`SELECT COUNT(*) AS total
			 FROM curriculum_topic_sources
			 JOIN curriculum_topics ON curriculum_topics.id = curriculum_topic_sources.topic_id
			 WHERE curriculum_topic_sources.source_id = 'src-selina-concise-physics-x'
			   AND curriculum_topics.class_level = 'X'
			   AND curriculum_topics.subject = 'Physics'`,
		).first<{ total: number }>();
		expect(links?.total).toBe(12);
	});
});
