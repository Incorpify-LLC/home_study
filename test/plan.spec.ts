import { applyD1Migrations, env, SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

const parentEmail = 'parent-plan@example.test';
const studentEmail = 'student-plan@example.test';
const otherStudentEmail = 'student-plan-b@example.test';

function accessHeaders(email: string, json = false): HeadersInit {
	return {
		'cf-access-test-email': email,
		...(json ? { 'content-type': 'application/json' } : {}),
	};
}

type PlanDay = {
	date: string;
	capacityMinutes: number;
	allocatedMinutes: number;
	entries: Array<{ subject: string; sequence: number; title: string; minutes: number; state: string }>;
};

type PlanPayload = {
	learner: { id: string; displayName: string; classLevel: string };
	settings: { weekdayMinutes: number; weekendMinutes: number; restWeekdays: number[]; horizonDays: number };
	plan: {
		revision: number;
		changeReason: string;
		startDate: string;
		endDate: string;
		days: PlanDay[];
		unscheduled: Array<{ subject: string; sequence: number }>;
	};
};

async function fetchPlan(email: string, learnerId = 'student-plan'): Promise<{ status: number; body: PlanPayload }> {
	const response = await SELF.fetch(`https://study.saneax.in/api/parent/learners/${learnerId}/plan`, {
		headers: accessHeaders(email),
	});
	return { status: response.status, body: (await response.json()) as PlanPayload };
}

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
	await env.DB.batch([
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('parent-plan', 'parent', 'Parent Plan', ?)`).bind(
			parentEmail,
		),
		env.DB.prepare(
			`INSERT INTO users (id, role, display_name, email) VALUES ('parent-plan-b', 'parent', 'Parent B', 'parent-plan-b@example.test')`,
		),
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('student-plan', 'student', 'Student Plan', ?)`).bind(
			studentEmail,
		),
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('student-plan-b', 'student', 'Student Plan B', ?)`).bind(
			otherStudentEmail,
		),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-plan', 'CISCE', 'VIII', NULL)`),
		env.DB.prepare(
			`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-plan-b', 'CISCE', 'VIII', NULL)`,
		),
		env.DB.prepare(`INSERT INTO parent_students (parent_id, student_id) VALUES ('parent-plan', 'student-plan')`),
		env.DB.prepare(`INSERT INTO parent_students (parent_id, student_id) VALUES ('parent-plan-b', 'student-plan-b')`),
	]);
});

describe('parent study-hours settings and calendar', () => {
	it('requires a parent identity linked to the learner', async () => {
		const anonymous = await SELF.fetch('https://study.saneax.in/api/parent/learners/student-plan/plan');
		expect(anonymous.status).toBe(401);

		const student = await SELF.fetch('https://study.saneax.in/api/parent/learners/student-plan/plan', {
			headers: accessHeaders(studentEmail),
		});
		expect(student.status).toBe(403);

		const stranger = await fetchPlan('parent-plan-b@example.test');
		expect(stranger.status).toBe(403);
	});

	it('builds a calendar from the parent-set study hours', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/parent/learners/student-plan/study-settings', {
			method: 'PUT',
			headers: accessHeaders(parentEmail, true),
			body: JSON.stringify({ weekdayMinutes: 90, weekendMinutes: 180, restWeekdays: [7], horizonDays: 21 }),
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as PlanPayload;
		expect(body.settings).toEqual({ weekdayMinutes: 90, weekendMinutes: 180, restWeekdays: [7], horizonDays: 21 });
		expect(body.plan.revision).toBe(1);
		expect(body.plan.changeReason).toBe('initial');

		expect(body.plan.days).toHaveLength(21);
		for (const day of body.plan.days) {
			expect(day.allocatedMinutes).toBeLessThanOrEqual(day.capacityMinutes);
			for (const entry of day.entries) {
				expect(entry.minutes).toBeGreaterThan(0);
				expect(entry.title.length).toBeGreaterThan(0);
			}
		}
		const restDays = body.plan.days.filter((day) => day.capacityMinutes === 0);
		expect(restDays.length).toBeGreaterThan(0);
		for (const day of restDays) expect(day.entries).toHaveLength(0);

		const weekdays = body.plan.days.filter((day) => day.capacityMinutes > 0 && day.capacityMinutes === 90);
		const weekends = body.plan.days.filter((day) => day.capacityMinutes === 180);
		expect(weekdays.length).toBeGreaterThan(0);
		expect(weekends.length).toBeGreaterThan(0);
	});

	it('sorts exercises from every subject the learner carries', async () => {
		const { body } = await fetchPlan(parentEmail);
		const subjects = new Set(body.plan.days.flatMap((day) => day.entries.map((entry) => entry.subject)));
		expect([...subjects].sort()).toEqual(['Mathematics', 'Physics']);

		// Both subjects make progress inside the first active week instead of
		// one subject monopolising the calendar.
		const activeDays = body.plan.days.filter((day) => day.entries.length > 0).slice(0, 4);
		const firstWeekSubjects = new Set(activeDays.flatMap((day) => day.entries.map((entry) => entry.subject)));
		expect([...firstWeekSubjects].sort()).toEqual(['Mathematics', 'Physics']);
	});

	it('reschedules when the parent changes the daily hours', async () => {
		const before = await fetchPlan(parentEmail);
		const beforeFinish = before.body.plan.days.filter((day) => day.entries.length > 0).at(-1)?.date ?? null;

		const response = await SELF.fetch('https://study.saneax.in/api/parent/learners/student-plan/study-settings', {
			method: 'PUT',
			headers: accessHeaders(parentEmail, true),
			body: JSON.stringify({ weekdayMinutes: 180, weekendMinutes: 240, restWeekdays: [7], horizonDays: 21 }),
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as PlanPayload;
		expect(body.plan.revision).toBe(2);
		expect(body.plan.changeReason).toBe('hours_changed');
		expect(body.settings.weekdayMinutes).toBe(180);

		const afterFinish = body.plan.days.filter((day) => day.entries.length > 0).at(-1)?.date ?? null;
		expect(afterFinish).not.toBeNull();
		expect(beforeFinish).not.toBeNull();
		expect(afterFinish! <= beforeFinish!).toBe(true);

		const firstDayMinutes = body.plan.days.find((day) => day.entries.length > 0)?.allocatedMinutes ?? 0;
		expect(firstDayMinutes).toBeGreaterThan(90);
	});

	it('keeps the calendar identical when a reschedule changes nothing', async () => {
		const first = await SELF.fetch('https://study.saneax.in/api/parent/learners/student-plan/plan/reschedule', {
			method: 'POST',
			headers: accessHeaders(parentEmail),
		});
		expect(first.status).toBe(200);
		const firstBody = (await first.json()) as PlanPayload;
		const second = await SELF.fetch('https://study.saneax.in/api/parent/learners/student-plan/plan/reschedule', {
			method: 'POST',
			headers: accessHeaders(parentEmail),
		});
		expect(second.status).toBe(200);
		const secondBody = (await second.json()) as PlanPayload;

		const shape = (payload: PlanPayload) =>
			payload.plan.days.map((day) => ({
				date: day.date,
				entries: day.entries.map((entry) => `${entry.subject}#${entry.sequence}`),
			}));
		expect(shape(secondBody)).toEqual(shape(firstBody));
	});

	it('never schedules a chapter twice in the same plan', async () => {
		const { body } = await fetchPlan(parentEmail);
		const keys = body.plan.days.flatMap((day) => day.entries.map((entry) => `${entry.subject}#${entry.sequence}`));
		expect(new Set(keys).size).toBe(keys.length);
	});

	it('rejects study hours outside the supported range', async () => {
		const tooShort = await SELF.fetch('https://study.saneax.in/api/parent/learners/student-plan/study-settings', {
			method: 'PUT',
			headers: accessHeaders(parentEmail, true),
			body: JSON.stringify({ weekdayMinutes: 5, weekendMinutes: 180, restWeekdays: [7], horizonDays: 21 }),
		});
		expect(tooShort.status).toBe(400);
	});
});

describe('learner view of the published calendar', () => {
	it('shows the learner their own calendar and nothing else', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/learning/plan', {
			headers: accessHeaders(studentEmail),
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			plan: { revision: number; days: PlanDay[] };
			today: { date: string; entries: Array<{ subject: string; sequence: number }> };
		};
		const parentView = await fetchPlan(parentEmail);
		expect(body.plan.revision).toBe(parentView.body.plan.revision);
		expect(body.plan.days.map((day) => day.date)).toEqual(parentView.body.plan.days.map((day) => day.date));
		expect(body.today.date.length).toBe(10);

		const anonymous = await SELF.fetch('https://study.saneax.in/api/learning/plan');
		expect(anonymous.status).toBe(401);
	});
});

describe('parent verification of exercises', () => {
	it('shows the parent the reviewed questions with answers and rationales', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/parent/learners/student-plan/exercises?subject=Mathematics&sequence=1', {
			headers: accessHeaders(parentEmail),
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			exercise: {
				subject: string;
				sequence: number;
				title: string;
				lesson: { overview: string; keyPoints: string[] };
				questions: Array<{
					prompt: string;
					correctAnswer: unknown;
					rationale: string;
					studentAnswer: unknown;
					score: number | null;
				}>;
			};
		};
		expect(body.exercise.subject).toBe('Mathematics');
		expect(body.exercise.sequence).toBe(1);
		expect(body.exercise.lesson.overview.length).toBeGreaterThan(20);
		expect(body.exercise.lesson.keyPoints.length).toBeGreaterThanOrEqual(3);
		expect(body.exercise.questions.length).toBeGreaterThanOrEqual(5);
		for (const question of body.exercise.questions) {
			expect(question.correctAnswer).not.toBeNull();
			expect(question.rationale.length).toBeGreaterThan(10);
		}
		expect(body.exercise.questions[0].studentAnswer).toBeNull();
		expect(body.exercise.questions[0].score).toBeNull();
	});

	it('refuses an unlinked parent and an unknown chapter', async () => {
		const stranger = await SELF.fetch('https://study.saneax.in/api/parent/learners/student-plan/exercises?subject=Mathematics&sequence=1', {
			headers: accessHeaders('parent-plan-b@example.test'),
		});
		expect(stranger.status).toBe(403);

		const missing = await SELF.fetch('https://study.saneax.in/api/parent/learners/student-plan/exercises?subject=Mathematics&sequence=99', {
			headers: accessHeaders(parentEmail),
		});
		expect(missing.status).toBe(404);
	});

	it('shows the child response and score after submission', async () => {
		const current = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Mathematics', {
			headers: accessHeaders(studentEmail),
		});
		expect(current.status).toBe(200);
		const assignment = (await current.json()) as {
			assignment: {
				id: string;
				sequence: number;
				questions: Array<{ id: string; type: string; options: Array<{ id: string; label: string }> | null }>;
			};
		};
		expect(assignment.assignment.sequence).toBe(1);

		for (const question of assignment.assignment.questions) {
			const saved = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${assignment.assignment.id}/responses`, {
				method: 'PUT',
				headers: accessHeaders(studentEmail, true),
				body: JSON.stringify({
					questionId: question.id,
					answer: question.type === 'single_choice' ? { choice: question.options?.[0]?.id ?? 'a' } : { value: 1 },
					confidence: 3,
				}),
			});
			expect(saved.status).toBe(200);
		}
		const submitted = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${assignment.assignment.id}/submit`, {
			method: 'POST',
			headers: accessHeaders(studentEmail),
		});
		expect([200, 409]).toContain(submitted.status);

		const response = await SELF.fetch('https://study.saneax.in/api/parent/learners/student-plan/exercises?subject=Mathematics&sequence=1', {
			headers: accessHeaders(parentEmail),
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			exercise: {
				status: string;
				questions: Array<{ studentAnswer: unknown; score: number | null; correctAnswer: unknown }>;
			};
		};
		expect(body.exercise.status).toBe('submitted');
		expect(body.exercise.questions[0].studentAnswer).not.toBeNull();
		expect(typeof body.exercise.questions[0].score).toBe('number');
	});

	it('rolls unfinished work forward into the new calendar after a reschedule', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/parent/learners/student-plan/plan/reschedule', {
			method: 'POST',
			headers: accessHeaders(parentEmail),
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as PlanPayload;
		const scheduled = body.plan.days.flatMap((day) => day.entries.map((entry) => `${entry.subject}#${entry.sequence}`));
		// The submitted chapter is complete, so it must not be scheduled again.
		expect(scheduled).not.toContain('Mathematics#1');
		expect(scheduled).toContain('Mathematics#2');
		expect(scheduled).toContain('Physics#1');
	});
});
