import { applyD1Migrations, env, SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

const studentEmail = 'student-a@example.test';
const parentEmail = 'parent-a@example.test';

function accessHeaders(email: string, json = false): HeadersInit {
	return {
		'cf-access-test-email': email,
		...(json ? { 'content-type': 'application/json' } : {}),
	};
}

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
	await env.DB.batch([
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('parent-a', 'parent', 'Parent A', ?)`).bind(parentEmail),
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('parent-b', 'parent', 'Parent B', 'parent-b@example.test')`),
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('student-a', 'student', 'Student A', ?)`).bind(studentEmail),
		env.DB.prepare(
			`INSERT INTO users (id, role, display_name, email) VALUES ('student-b', 'student', 'Student B', 'student-b@example.test')`,
		),
		env.DB.prepare(
			`INSERT INTO users (id, role, display_name, email) VALUES ('student-c', 'student', 'Student C', 'student-c@example.test')`,
		),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-a', 'CISCE', 'VIII', NULL)`),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-b', 'CISCE', 'X', 2027)`),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-c', 'CISCE', 'XII', 2027)`),
		env.DB.prepare(`INSERT INTO parent_students (parent_id, student_id) VALUES ('parent-a', 'student-a')`),
		env.DB.prepare(`INSERT INTO parent_students (parent_id, student_id) VALUES ('parent-b', 'student-b')`),
	]);
});

describe('reviewed learning assignment', () => {
	it('requires a mapped student identity', async () => {
		const anonymous = await SELF.fetch('https://study.saneax.in/api/learning/current');
		expect(anonymous.status).toBe(401);

		const parent = await SELF.fetch('https://study.saneax.in/api/learning/current', {
			headers: accessHeaders(parentEmail),
		});
		expect(parent.status).toBe(403);
	});

	it('creates one reviewed class-appropriate diagnostic without exposing answers', async () => {
		const first = await SELF.fetch('https://study.saneax.in/api/learning/current', {
			headers: accessHeaders(studentEmail),
		});
		expect(first.status).toBe(200);
		const payload = (await first.json()) as {
			assignment: {
				id: string;
				classLevel: string;
				subject: string;
				title: string;
				status: string;
				lesson: {
					title: string;
					overview: string;
					keyPoints: string[];
					workedExample: { prompt: string; steps: string[]; answer: string };
				};
				questions: Array<Record<string, unknown>>;
			};
		};
		expect(payload.assignment.classLevel).toBe('VIII');
		expect(payload.assignment.subject).toBe('Mathematics');
		expect(payload.assignment.title).toContain('Rational numbers');
		expect(payload.assignment.status).toBe('assigned');
		expect(payload.assignment.lesson.keyPoints.length).toBeGreaterThanOrEqual(3);
		expect(payload.assignment.lesson.workedExample.steps.length).toBeGreaterThanOrEqual(2);
		expect(payload.assignment.questions).toHaveLength(6);
		for (const question of payload.assignment.questions) {
			expect(question).not.toHaveProperty('answer');
			expect(question).not.toHaveProperty('rationale');
		}

		const second = await SELF.fetch('https://study.saneax.in/api/learning/current', {
			headers: accessHeaders(studentEmail),
		});
		const repeated = (await second.json()) as { assignment: { id: string } };
		expect(repeated.assignment.id).toBe(payload.assignment.id);
	});

	it('serves reviewed Mathematics and Accountancy diagnostics to all three class tracks', async () => {
		const cases = [
			{ email: 'student-b@example.test', classLevel: 'X', subject: 'Mathematics', title: 'Quadratic equations' },
			{ email: 'student-c@example.test', classLevel: 'XII', subject: 'Accountancy', title: 'Partnership fundamentals' },
		];
		for (const expected of cases) {
			const response = await SELF.fetch('https://study.saneax.in/api/learning/current', {
				headers: accessHeaders(expected.email),
			});
			expect(response.status).toBe(200);
			const payload = (await response.json()) as {
				assignment: { classLevel: string; subject: string; title: string; questions: unknown[] };
			};
			expect(payload.assignment).toMatchObject({
				classLevel: expected.classLevel,
				subject: expected.subject,
			});
			expect(payload.assignment.title).toContain(expected.title);
			expect(payload.assignment.questions).toHaveLength(6);
		}
	});

	it('saves and resumes a draft response', async () => {
		const current = await SELF.fetch('https://study.saneax.in/api/learning/current', {
			headers: accessHeaders(studentEmail),
		});
		const currentBody = (await current.json()) as {
			assignment: { id: string; questions: Array<{ id: string; type: string }> };
		};
		const question = currentBody.assignment.questions.find((item) => item.type === 'single_choice');
		expect(question).toBeDefined();

		const saved = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${currentBody.assignment.id}/responses`, {
			method: 'PUT',
			headers: accessHeaders(studentEmail, true),
			body: JSON.stringify({ questionId: question?.id, answer: { choice: 'b' }, confidence: 4 }),
		});
		expect(saved.status).toBe(200);
		expect(await saved.json()).toEqual({ saved: true });

		const resumed = await SELF.fetch('https://study.saneax.in/api/learning/current', {
			headers: accessHeaders(studentEmail),
		});
		const resumedBody = (await resumed.json()) as {
			assignment: { status: string; questions: Array<{ id: string; response?: { answer: unknown; confidence: number } }> };
		};
		expect(resumedBody.assignment.status).toBe('in_progress');
		expect(resumedBody.assignment.questions.find((item) => item.id === question?.id)?.response).toEqual({
			answer: { choice: 'b' },
			confidence: 4,
		});
	});

	it('validates response shape and prevents cross-student writes', async () => {
		const current = await SELF.fetch('https://study.saneax.in/api/learning/current', {
			headers: accessHeaders(studentEmail),
		});
		const body = (await current.json()) as { assignment: { id: string; questions: Array<{ id: string; type: string }> } };
		const numeric = body.assignment.questions.find((item) => item.type === 'numeric');
		expect(numeric).toBeDefined();

		const invalid = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${body.assignment.id}/responses`, {
			method: 'PUT',
			headers: accessHeaders(studentEmail, true),
			body: JSON.stringify({ questionId: numeric?.id, answer: { value: 'not-a-number' } }),
		});
		expect(invalid.status).toBe(400);

		const other = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${body.assignment.id}/responses`, {
			method: 'PUT',
			headers: accessHeaders('student-b@example.test', true),
			body: JSON.stringify({ questionId: numeric?.id, answer: { value: 1 } }),
		});
		expect(other.status).toBe(404);
	});

	it('requires every answer, scores once, and reveals corrections only after submission', async () => {
		const current = await SELF.fetch('https://study.saneax.in/api/learning/current', {
			headers: accessHeaders(studentEmail),
		});
		const body = (await current.json()) as {
			assignment: { id: string; questions: Array<{ id: string; type: string }> };
		};

		const incomplete = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${body.assignment.id}/submit`, {
			method: 'POST',
			headers: accessHeaders(studentEmail),
		});
		expect(incomplete.status).toBe(409);

		const answers: Record<string, { choice: string } | { value: number }> = {
			'viii-rational-between': { choice: 'b' },
			'viii-rational-add': { value: 0.75 },
			'viii-rational-inverse': { choice: 'c' },
			'viii-exponent-product': { value: 27 },
			'viii-exponent-negative': { value: 0.125 },
			'viii-rational-word': { value: 0.25 },
		};
		answers['viii-rational-word'] = { value: 0.5 };

		for (const question of body.assignment.questions) {
			const response = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${body.assignment.id}/responses`, {
				method: 'PUT',
				headers: accessHeaders(studentEmail, true),
				body: JSON.stringify({ questionId: question.id, answer: answers[question.id], confidence: 3 }),
			});
			expect(response.status).toBe(200);
		}

		const submitted = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${body.assignment.id}/submit`, {
			method: 'POST',
			headers: accessHeaders(studentEmail),
		});
		expect(submitted.status).toBe(200);
		const result = (await submitted.json()) as {
			result: { earned: number; possible: number; percentage: number; corrections: Array<Record<string, unknown>> };
		};
		expect(result.result.earned).toBe(5);
		expect(result.result.possible).toBe(6);
		expect(result.result.percentage).toBe(83);
		expect(result.result.corrections).toHaveLength(6);
		for (const correction of result.result.corrections) {
			expect(correction).toHaveProperty('rationale');
			expect(correction).toHaveProperty('correctAnswer');
		}

		const editAfterSubmit = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${body.assignment.id}/responses`, {
			method: 'PUT',
			headers: accessHeaders(studentEmail, true),
			body: JSON.stringify({ questionId: body.assignment.questions[0].id, answer: { choice: 'a' } }),
		});
		expect(editAfterSubmit.status).toBe(409);
	});
});

describe('parent evidence view', () => {
	it('returns evidence only for a linked learner', async () => {
		const allowed = await SELF.fetch('https://study.saneax.in/api/students/student-a/progress', {
			headers: accessHeaders(parentEmail),
		});
		expect(allowed.status).toBe(200);
		const body = (await allowed.json()) as {
			student: { id: string; displayName: string };
			assignments: Array<{ subject: string; status: string; earned: number; possible: number; evidence: unknown[] }>;
		};
		expect(body.student).toEqual({ id: 'student-a', displayName: 'Student A' });
		expect(body.assignments[0]).toMatchObject({ subject: 'Mathematics', status: 'submitted', earned: 5, possible: 6 });
		expect(body.assignments[0].evidence).toHaveLength(6);

		const forbidden = await SELF.fetch('https://study.saneax.in/api/students/student-b/progress', {
			headers: accessHeaders(parentEmail),
		});
		expect(forbidden.status).toBe(404);
	});
});
