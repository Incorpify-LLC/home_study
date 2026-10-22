import { applyD1Migrations, env, SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { istToday } from '../src/plan';

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
		env.DB.prepare(
			`INSERT INTO users (id, role, display_name, email) VALUES ('student-d', 'student', 'Student D', 'student-d@example.test')`,
		),
		env.DB.prepare(
			`INSERT INTO users (id, role, display_name, email) VALUES ('student-e', 'student', 'Student E', 'student-e@example.test')`,
		),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-a', 'CISCE', 'VIII', NULL)`),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-b', 'CISCE', 'X', 2027)`),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-c', 'CISCE', 'XII', 2027)`),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-d', 'CISCE', 'VIII', NULL)`),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-e', 'CISCE', 'X', 2027)`),
		env.DB.prepare(`INSERT INTO parent_students (parent_id, student_id) VALUES ('parent-a', 'student-a')`),
		env.DB.prepare(`INSERT INTO parent_students (parent_id, student_id) VALUES ('parent-b', 'student-b')`),
	]);
});

describe('sequential chapter progression', () => {
	it('publishes every reviewed chapter in a class-specific roadmap', async () => {
		const expected = [
			{ email: 'student-d@example.test', subject: 'Mathematics', total: 11 },
			{ email: 'student-b@example.test', subject: 'Mathematics', total: 18 },
			{ email: 'student-c@example.test', subject: 'Accountancy', total: 12 },
		];

		for (const track of expected) {
			const response = await SELF.fetch('https://study.saneax.in/api/learning/roadmaps', {
				headers: accessHeaders(track.email),
			});
			expect(response.status).toBe(200);
			const payload = (await response.json()) as {
				tracks: Array<{
					subject: string;
					total: number;
					completed: number;
					modules: Array<{ sequence: number; title: string; status: string }>;
				}>;
			};
			const found = payload.tracks.find((candidate) => candidate.subject === track.subject);
			expect(found).toBeDefined();
			expect(found?.total).toBe(track.total);
			expect(found?.modules).toHaveLength(track.total);
			expect(found?.modules.map((module) => module.sequence)).toEqual(Array.from({ length: track.total }, (_, index) => index + 1));
		}
	});

	it('does not unlock the next chapter before the current one is submitted', async () => {
		const current = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Mathematics', {
			headers: accessHeaders('student-d@example.test'),
		});
		expect(current.status).toBe(200);
		const body = (await current.json()) as { assignment: { id: string; sequence: number; totalModules: number } };
		expect(body.assignment.sequence).toBe(1);
		expect(body.assignment.totalModules).toBe(11);

		const blocked = await SELF.fetch('https://study.saneax.in/api/learning/next?subject=Mathematics', {
			method: 'POST',
			headers: accessHeaders('student-d@example.test'),
		});
		expect(blocked.status).toBe(409);
	});

	it('unlocks exactly the next chapter after submission', async () => {
		const existing = await env.DB.prepare(
			`SELECT assignments.id
			 FROM assignments
			 JOIN assignment_templates ON assignment_templates.id = assignments.template_id
			 WHERE assignments.student_id = 'student-d' AND assignment_templates.subject = 'Mathematics'
			 ORDER BY assignments.created_at LIMIT 1`,
		).first<{ id: string }>();
		expect(existing).not.toBeNull();
		await env.DB.prepare(`UPDATE assignments SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP WHERE id = ?`)
			.bind(existing?.id)
			.run();

		const next = await SELF.fetch('https://study.saneax.in/api/learning/next?subject=Mathematics', {
			method: 'POST',
			headers: accessHeaders('student-d@example.test'),
		});
		expect(next.status).toBe(200);
		const nextBody = (await next.json()) as {
			assignment: { id: string; sequence: number; totalModules: number; title: string };
		};
		expect(nextBody.assignment.sequence).toBe(2);
		expect(nextBody.assignment.totalModules).toBe(11);
		expect(nextBody.assignment.title).toContain('Squares');

		const repeated = await SELF.fetch('https://study.saneax.in/api/learning/next?subject=Mathematics', {
			method: 'POST',
			headers: accessHeaders('student-d@example.test'),
		});
		expect(repeated.status).toBe(409);

		const roadmap = await SELF.fetch('https://study.saneax.in/api/learning/roadmaps', {
			headers: accessHeaders('student-d@example.test'),
		});
		const roadmapBody = (await roadmap.json()) as {
			tracks: Array<{
				subject: string;
				completed: number;
				modules: Array<{ sequence: number; status: string }>;
			}>;
		};
		const mathematics = roadmapBody.tracks.find((track) => track.subject === 'Mathematics');
		expect(mathematics?.completed).toBe(1);
		expect(mathematics?.modules[0].status).toBe('submitted');
		expect(mathematics?.modules[1].status).toBe('assigned');
	});
});

describe('multi-subject tracks', () => {
	it('serves independent per-subject roadmaps and progression for a learner with multiple subjects', async () => {
		// student-d is a Class VIII learner: Chemistry (9), Mathematics (11) and Physics (8).
		const roadmap = await SELF.fetch('https://study.saneax.in/api/learning/roadmaps', {
			headers: accessHeaders('student-d@example.test'),
		});
		expect(roadmap.status).toBe(200);
		const body = (await roadmap.json()) as {
			tracks: Array<{
				subject: string;
				total: number;
				completed: number;
				current: { sequence: number; title: string } | null;
			}>;
		};
		expect(body.tracks.map((track) => track.subject).sort()).toEqual(['Chemistry', 'Mathematics', 'Physics']);
		const chemistry = body.tracks.find((track) => track.subject === 'Chemistry');
		const mathematics = body.tracks.find((track) => track.subject === 'Mathematics');
		const physics = body.tracks.find((track) => track.subject === 'Physics');
		expect(chemistry?.total).toBe(9);
		expect(chemistry?.completed).toBe(0);
		expect(chemistry?.current?.sequence).toBe(1);
		expect(mathematics?.total).toBe(11);
		expect(mathematics?.current?.sequence).toBe(2);
		expect(mathematics?.completed).toBe(1);
		expect(physics?.total).toBe(8);
		expect(physics?.completed).toBe(0);
		expect(physics?.current?.sequence).toBe(1);

		// Per-subject current assignment: Physics first chapter is served independently
		// of the Mathematics assignment that is already open.
		const physicsCurrent = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Physics', {
			headers: accessHeaders('student-d@example.test'),
		});
		expect(physicsCurrent.status).toBe(200);
		const physicsBody = (await physicsCurrent.json()) as {
			assignment: { subject: string; sequence: number; totalModules: number; questions: unknown[] };
		};
		expect(physicsBody.assignment.subject).toBe('Physics');
		expect(physicsBody.assignment.sequence).toBe(1);
		expect(physicsBody.assignment.totalModules).toBe(8);
		expect(physicsBody.assignment.questions.length).toBeGreaterThanOrEqual(5);

		// The next Physics chapter stays locked until the current Physics chapter is submitted.
		const blockedNext = await SELF.fetch('https://study.saneax.in/api/learning/next?subject=Physics', {
			method: 'POST',
			headers: accessHeaders('student-d@example.test'),
		});
		expect(blockedNext.status).toBe(409);

		const physicsAssignment = await env.DB.prepare(
			`SELECT assignments.id
			 FROM assignments
			 JOIN assignment_templates ON assignment_templates.id = assignments.template_id
			 WHERE assignments.student_id = 'student-d' AND assignment_templates.subject = 'Physics'`,
		).first<{ id: string }>();
		expect(physicsAssignment).not.toBeNull();
		await env.DB.prepare(`UPDATE assignments SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP WHERE id = ?`)
			.bind(physicsAssignment?.id)
			.run();

		const advanced = await SELF.fetch('https://study.saneax.in/api/learning/next?subject=Physics', {
			method: 'POST',
			headers: accessHeaders('student-d@example.test'),
		});
		expect(advanced.status).toBe(200);
		const advancedBody = (await advanced.json()) as { assignment: { subject: string; sequence: number } };
		expect(advancedBody.assignment.subject).toBe('Physics');
		expect(advancedBody.assignment.sequence).toBe(2);

		// Mathematics progression is untouched by Physics submissions.
		const mathematicsCurrent = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Mathematics', {
			headers: accessHeaders('student-d@example.test'),
		});
		const mathematicsBody = (await mathematicsCurrent.json()) as { assignment: { sequence: number } };
		expect(mathematicsBody.assignment.sequence).toBe(2);

		const updatedRoadmap = await SELF.fetch('https://study.saneax.in/api/learning/roadmaps', {
			headers: accessHeaders('student-d@example.test'),
		});
		const updatedBody = (await updatedRoadmap.json()) as {
			tracks: Array<{ subject: string; completed: number; current: { sequence: number } | null }>;
		};
		expect(updatedBody.tracks.find((track) => track.subject === 'Physics')?.completed).toBe(1);
		expect(updatedBody.tracks.find((track) => track.subject === 'Mathematics')?.completed).toBe(1);
	});

	it("opens today's scheduled subject before an off-schedule assigned chapter", async () => {
		const today = istToday();
		const templates = await env.DB.prepare(
			`SELECT id, subject, sequence, estimated_minutes AS estimatedMinutes
			 FROM assignment_templates
			 WHERE class_level = 'X'
			   AND ((subject = 'Mathematics' AND sequence IN (1, 5)) OR (subject = 'Physics' AND sequence = 2))`,
		).all<{ id: string; subject: string; sequence: number; estimatedMinutes: number }>();
		const mathematics = templates.results.find((template) => template.subject === 'Mathematics' && template.sequence === 1);
		const previousMathematics = templates.results.find((template) => template.subject === 'Mathematics' && template.sequence === 5);
		const physics = templates.results.find((template) => template.subject === 'Physics');
		expect(mathematics).toBeDefined();
		expect(previousMathematics).toBeDefined();
		expect(physics).toBeDefined();

		await env.DB.batch([
			env.DB.prepare(
				`INSERT INTO study_plans
				   (id, student_id, revision, start_date, end_date, weekday_minutes, weekend_minutes, rest_weekdays, change_reason, active)
				 VALUES ('student-e-plan', 'student-e', 1, ?, ?, 120, 120, '[]', 'initial', 1)`,
			).bind(today, today),
			env.DB.prepare(
				`INSERT INTO study_plan_entries
				   (id, plan_id, student_id, scheduled_for, subject, sequence, template_id, allocated_minutes, position)
				 VALUES ('student-e-math-today', 'student-e-plan', 'student-e', ?, 'Mathematics', 1, ?, ?, 0)`,
			).bind(today, mathematics?.id, mathematics?.estimatedMinutes),
			env.DB.prepare(
				`INSERT INTO assignments (id, student_id, assigned_for, status, estimated_minutes, template_id, submitted_at)
				 VALUES ('student-e-old-math', 'student-e', ?, 'submitted', ?, ?, CURRENT_TIMESTAMP)`,
			).bind(today, previousMathematics?.estimatedMinutes, previousMathematics?.id),
			env.DB.prepare(
				`INSERT INTO assignments (id, student_id, assigned_for, status, estimated_minutes, template_id)
				 VALUES ('student-e-physics-2', 'student-e', ?, 'assigned', ?, ?)`,
			).bind(today, physics?.estimatedMinutes, physics?.id),
			env.DB.prepare(
				`INSERT INTO assignment_items (assignment_id, question_id, position)
				 SELECT 'student-e-physics-2', question_id, position
				 FROM assignment_template_items WHERE template_id = ?`,
			).bind(physics?.id),
		]);

		const response = await SELF.fetch('https://study.saneax.in/api/learning/current', {
			headers: accessHeaders('student-e@example.test'),
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as { assignment: { subject: string; sequence: number } };
		expect(body.assignment).toMatchObject({ subject: 'Mathematics', sequence: 1 });
	});
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
		const first = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Mathematics', {
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

		const second = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Mathematics', {
			headers: accessHeaders(studentEmail),
		});
		const repeated = (await second.json()) as { assignment: { id: string } };
		expect(repeated.assignment.id).toBe(payload.assignment.id);
	});

	it('serves reviewed Mathematics and Accountancy diagnostics to all three class tracks', async () => {
		const cases = [
			{ email: 'student-b@example.test', classLevel: 'X', subject: 'Mathematics', title: 'Goods and Services Tax', count: 5 },
			{
				email: 'student-c@example.test',
				classLevel: 'XII',
				subject: 'Accountancy',
				title: 'Partnership fundamentals',
				count: 6,
			},
		];
		for (const expected of cases) {
			const response = await SELF.fetch(`https://study.saneax.in/api/learning/current?subject=${encodeURIComponent(expected.subject)}`, {
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
			expect(payload.assignment.questions).toHaveLength(expected.count);
		}
	});

	it('saves and resumes a draft response', async () => {
		const current = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Mathematics', {
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

		const resumed = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Mathematics', {
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
		const current = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Mathematics', {
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
		const current = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Mathematics', {
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

	it('lets a learner list and reopen only their submitted exercises', async () => {
		const history = await SELF.fetch('https://study.saneax.in/api/learning/history', {
			headers: accessHeaders(studentEmail),
		});
		expect(history.status).toBe(200);
		const historyBody = (await history.json()) as {
			exercises: Array<{
				id: string;
				title: string;
				subject: string;
				sequence: number;
				earned: number;
				possible: number;
				percentage: number;
				submittedAt: string;
			}>;
		};
		expect(historyBody.exercises).toHaveLength(1);
		expect(historyBody.exercises[0]).toMatchObject({
			title: 'Rational numbers and exponents · diagnostic 1',
			subject: 'Mathematics',
			sequence: 1,
			earned: 5,
			possible: 6,
			percentage: 83,
		});
		expect(historyBody.exercises[0].submittedAt).toBeTruthy();

		const detail = await SELF.fetch(`https://study.saneax.in/api/learning/history/${historyBody.exercises[0].id}`, {
			headers: accessHeaders(studentEmail),
		});
		expect(detail.status).toBe(200);
		const detailBody = (await detail.json()) as {
			assignment: { title: string; status: string; result: { corrections: unknown[] } };
		};
		expect(detailBody.assignment.title).toBe('Rational numbers and exponents · diagnostic 1');
		expect(detailBody.assignment.status).toBe('submitted');
		expect(detailBody.assignment.result.corrections).toHaveLength(6);

		const otherLearner = await SELF.fetch(`https://study.saneax.in/api/learning/history/${historyBody.exercises[0].id}`, {
			headers: accessHeaders('student-b@example.test'),
		});
		expect(otherLearner.status).toBe(404);

		const parent = await SELF.fetch('https://study.saneax.in/api/learning/history', {
			headers: accessHeaders(parentEmail),
		});
		expect(parent.status).toBe(403);
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
