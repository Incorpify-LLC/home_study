import { applyD1Migrations, env, SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { istToday } from '../src/plan';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

const studentEmail = 'hero-student@example.test';
const parentEmail = 'hero-parent@example.test';

function accessHeaders(email: string, json = false): HeadersInit {
	return {
		'cf-access-test-email': email,
		...(json ? { 'content-type': 'application/json' } : {}),
	};
}

function dateBefore(date: string, days: number): string {
	const value = new Date(`${date}T00:00:00.000Z`);
	value.setUTCDate(value.getUTCDate() - days);
	return value.toISOString().slice(0, 10);
}

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
	await env.DB.batch([
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('hero-parent', 'parent', 'Parent Hero', ?)`).bind(
			parentEmail,
		),
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('hero-student', 'student', 'Student Hero', ?)`).bind(
			studentEmail,
		),
		env.DB.prepare(
			`INSERT INTO users (id, role, display_name, email) VALUES ('hero-recovery', 'student', 'Recovery Student', 'hero-recovery@example.test')`,
		),
		env.DB.prepare(
			`INSERT INTO users (id, role, display_name, email) VALUES ('hero-streak', 'student', 'Streak Student', 'hero-streak@example.test')`,
		),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level) VALUES ('hero-student', 'CISCE', 'VIII')`),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level) VALUES ('hero-recovery', 'CISCE', 'VIII')`),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level) VALUES ('hero-streak', 'CISCE', 'VIII')`),
		env.DB.prepare(`INSERT INTO parent_students (parent_id, student_id) VALUES ('hero-parent', 'hero-student')`),
		env.DB.prepare(`INSERT INTO parent_students (parent_id, student_id) VALUES ('hero-parent', 'hero-recovery')`),
		env.DB.prepare(`INSERT INTO parent_students (parent_id, student_id) VALUES ('hero-parent', 'hero-streak')`),
	]);
});

describe('Hero Path rewards', () => {
	it('awards daily-plan and on-schedule XP once, regardless of answer score', async () => {
		const current = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Chemistry', {
			headers: accessHeaders(studentEmail),
		});
		expect(current.status).toBe(200);
		const currentBody = (await current.json()) as {
			assignment: { id: string; questions: Array<{ id: string; type: string; options: Array<{ id: string }> | null }> };
		};
		const assignmentId = currentBody.assignment.id;
		const assignment = await env.DB.prepare(`SELECT template_id AS templateId FROM assignments WHERE id = ?`)
			.bind(assignmentId)
			.first<{ templateId: string }>();
		expect(assignment).not.toBeNull();
		const today = istToday();
		await env.DB.batch([
			env.DB.prepare(
				`INSERT INTO study_plans
				 (id, student_id, revision, start_date, end_date, weekday_minutes, weekend_minutes, rest_weekdays, change_reason)
				 VALUES ('hero-plan', 'hero-student', 1, ?, ?, 90, 120, '[]', 'initial')`,
			).bind(today, today),
			env.DB.prepare(
				`INSERT INTO study_plan_entries
				 (id, plan_id, student_id, scheduled_for, subject, sequence, template_id, allocated_minutes, position)
				 VALUES ('hero-entry', 'hero-plan', 'hero-student', ?, 'Chemistry', 1, ?, 40, 0)`,
			).bind(today, assignment?.templateId),
		]);

		const answerRows = await env.DB.prepare(
			`SELECT questions.id, questions.answer_json AS answerJson, questions.options_json AS optionsJson
			 FROM assignment_items
			 JOIN questions ON questions.id = assignment_items.question_id
			 WHERE assignment_items.assignment_id = ?
			 ORDER BY assignment_items.position`,
		)
			.bind(assignmentId)
			.all<{ id: string; answerJson: string; optionsJson: string | null }>();
		for (const [index, row] of answerRows.results.entries()) {
			let answer = JSON.parse(row.answerJson) as { choice?: string; value?: number };
			if (index === 0 && answer.choice && row.optionsJson) {
				const alternatives = JSON.parse(row.optionsJson) as Array<{ id: string }>;
				answer = { choice: alternatives.find((option) => option.id !== answer.choice)?.id ?? answer.choice };
			}
			const saved = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${assignmentId}/responses`, {
				method: 'PUT',
				headers: accessHeaders(studentEmail, true),
				body: JSON.stringify({ questionId: row.id, answer }),
			});
			expect(saved.status).toBe(200);
		}

		const submitted = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${assignmentId}/submit`, {
			method: 'POST',
			headers: accessHeaders(studentEmail),
		});
		expect(submitted.status).toBe(200);

		const hero = await SELF.fetch('https://study.saneax.in/api/learning/hero', {
			headers: accessHeaders(studentEmail),
		});
		expect(hero.status).toBe(200);
		const payload = (await hero.json()) as {
			hero: {
				totalXp: number;
				rank: { name: string };
				events: Array<{ type: string; points: number }>;
			};
		};
		expect(payload.hero.totalXp).toBe(13);
		expect(payload.hero.rank.name).toBe('Initiate');
		expect(payload.hero.events).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ type: 'daily_plan', points: 10 }),
				expect.objectContaining({ type: 'on_schedule', points: 3 }),
			]),
		);
		expect(payload.hero.events.some((event) => event.points < 0)).toBe(false);

		const repeated = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${assignmentId}/submit`, {
			method: 'POST',
			headers: accessHeaders(studentEmail),
		});
		expect(repeated.status).toBe(200);
		const afterRepeat = await SELF.fetch('https://study.saneax.in/api/learning/hero', {
			headers: accessHeaders(studentEmail),
		});
		const afterRepeatBody = (await afterRepeat.json()) as { hero: { totalXp: number } };
		expect(afterRepeatBody.hero.totalXp).toBe(13);
	});

	it('awards correction XP once after a learner reviews an incorrect answer', async () => {
		const assignment = await env.DB.prepare(
			`SELECT id FROM assignments WHERE student_id = 'hero-student' AND status = 'submitted' ORDER BY submitted_at DESC LIMIT 1`,
		).first<{ id: string }>();
		expect(assignment).not.toBeNull();

		const completed = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${assignment?.id}/corrections`, {
			method: 'POST',
			headers: accessHeaders(studentEmail),
		});
		expect(completed.status).toBe(200);
		expect(await completed.json()).toMatchObject({ awardedXp: 5 });

		const repeated = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${assignment?.id}/corrections`, {
			method: 'POST',
			headers: accessHeaders(studentEmail),
		});
		expect(repeated.status).toBe(200);
		expect(await repeated.json()).toMatchObject({ awardedXp: 0 });

		const hero = await SELF.fetch('https://study.saneax.in/api/learning/hero', {
			headers: accessHeaders(studentEmail),
		});
		const payload = (await hero.json()) as { hero: { totalXp: number } };
		expect(payload.hero.totalXp).toBe(18);
	});

	it('turns three unresolved misses into Recovery Quests without deducting XP', async () => {
		const today = istToday();
		const dates = [dateBefore(today, 3), dateBefore(today, 2), dateBefore(today, 1)];
		const templates = await env.DB.prepare(
			`SELECT id, sequence FROM assignment_templates
			 WHERE class_level = 'VIII' AND subject = 'Chemistry' AND sequence IN (2, 3, 4) AND active = 1
			 ORDER BY sequence`,
		).all<{ id: string; sequence: number }>();
		expect(templates.results).toHaveLength(3);
		await env.DB.batch([
			env.DB.prepare(
				`INSERT INTO study_plans
				 (id, student_id, revision, start_date, end_date, weekday_minutes, weekend_minutes, rest_weekdays, change_reason)
				 VALUES ('hero-recovery-plan', 'hero-recovery', 1, ?, ?, 90, 120, '[]', 'initial')`,
			).bind(dates[0], dates[2]),
			...templates.results.map((template, index) =>
				env.DB.prepare(
					`INSERT INTO study_plan_entries
					 (id, plan_id, student_id, scheduled_for, subject, sequence, template_id, allocated_minutes, position)
					 VALUES (?, 'hero-recovery-plan', 'hero-recovery', ?, 'Chemistry', ?, ?, 40, 0)`,
				).bind(`hero-recovery-entry-${index + 1}`, dates[index], template.sequence, template.id),
			),
		]);

		const response = await SELF.fetch('https://study.saneax.in/api/learning/hero', {
			headers: accessHeaders('hero-recovery@example.test'),
		});
		expect(response.status).toBe(200);
		const payload = (await response.json()) as {
			hero: {
				totalXp: number;
				unresolvedMisses: number;
				streakBonusPaused: boolean;
				cosmeticUnlockPaused: boolean;
				recoveryQuests: Array<{ date: string; subject: string; sequence: number; status: string }>;
			};
		};
		expect(payload.hero.totalXp).toBe(0);
		expect(payload.hero.unresolvedMisses).toBe(3);
		expect(payload.hero.streakBonusPaused).toBe(true);
		expect(payload.hero.cosmeticUnlockPaused).toBe(true);
		expect(payload.hero.recoveryQuests).toHaveLength(3);
		expect(payload.hero.recoveryQuests.every((quest) => quest.status === 'open')).toBe(true);
	});

	it('lets a linked parent excuse a school-exam day without a penalty', async () => {
		const excusedDate = dateBefore(istToday(), 3);
		const response = await SELF.fetch(`https://study.saneax.in/api/parent/learners/hero-recovery/hero/days/${excusedDate}`, {
			method: 'PUT',
			headers: accessHeaders(parentEmail, true),
			body: JSON.stringify({ reason: 'school_exam', note: 'School assessment' }),
		});
		expect(response.status).toBe(200);
		const payload = (await response.json()) as {
			hero: {
				totalXp: number;
				unresolvedMisses: number;
				streakBonusPaused: boolean;
				recoveryQuests: Array<{ date: string; status: string }>;
			};
		};
		expect(payload.hero.totalXp).toBe(0);
		expect(payload.hero.unresolvedMisses).toBe(2);
		expect(payload.hero.streakBonusPaused).toBe(false);
		expect(payload.hero.recoveryQuests.find((quest) => quest.date === excusedDate)?.status).toBe('excused');

		const studentAttempt = await SELF.fetch(`https://study.saneax.in/api/parent/learners/hero-recovery/hero/days/${excusedDate}`, {
			method: 'PUT',
			headers: accessHeaders('hero-recovery@example.test', true),
			body: JSON.stringify({ reason: 'rest' }),
		});
		expect(studentAttempt.status).toBe(403);
	});

	it('awards a Recovery Quest once when overdue work is completed', async () => {
		const targetDate = dateBefore(istToday(), 2);
		const quest = await env.DB.prepare(
			`SELECT hero_recovery_quests.template_id AS templateId
			 FROM hero_recovery_quests
			 WHERE student_id = 'hero-recovery' AND scheduled_for = ? AND status = 'open'`,
		)
			.bind(targetDate)
			.first<{ templateId: string }>();
		expect(quest).not.toBeNull();
		await env.DB.batch([
			env.DB.prepare(
				`INSERT INTO assignments (id, student_id, assigned_for, status, estimated_minutes, template_id)
				 VALUES ('hero-late-assignment', 'hero-recovery', ?, 'assigned', 40, ?)`,
			).bind(targetDate, quest?.templateId),
			env.DB.prepare(
				`INSERT INTO assignment_items (assignment_id, question_id, position)
				 SELECT 'hero-late-assignment', question_id, position FROM assignment_template_items WHERE template_id = ?`,
			).bind(quest?.templateId),
		]);
		const questions = await env.DB.prepare(
			`SELECT questions.id, questions.answer_json AS answerJson
			 FROM assignment_items JOIN questions ON questions.id = assignment_items.question_id
			 WHERE assignment_items.assignment_id = 'hero-late-assignment' ORDER BY assignment_items.position`,
		).all<{ id: string; answerJson: string }>();
		for (const question of questions.results) {
			const saved = await SELF.fetch('https://study.saneax.in/api/learning/assignments/hero-late-assignment/responses', {
				method: 'PUT',
				headers: accessHeaders('hero-recovery@example.test', true),
				body: JSON.stringify({ questionId: question.id, answer: JSON.parse(question.answerJson) }),
			});
			expect(saved.status).toBe(200);
		}
		const submitted = await SELF.fetch('https://study.saneax.in/api/learning/assignments/hero-late-assignment/submit', {
			method: 'POST',
			headers: accessHeaders('hero-recovery@example.test'),
		});
		expect(submitted.status).toBe(200);

		const hero = await SELF.fetch('https://study.saneax.in/api/learning/hero', {
			headers: accessHeaders('hero-recovery@example.test'),
		});
		const payload = (await hero.json()) as {
			hero: { totalXp: number; unresolvedMisses: number; recoveryQuests: Array<{ date: string; status: string }> };
		};
		expect(payload.hero.totalXp).toBe(8);
		expect(payload.hero.unresolvedMisses).toBe(1);
		expect(payload.hero.recoveryQuests.find((item) => item.date === targetDate)?.status).toBe('completed');

		const repeated = await SELF.fetch('https://study.saneax.in/api/learning/assignments/hero-late-assignment/submit', {
			method: 'POST',
			headers: accessHeaders('hero-recovery@example.test'),
		});
		expect(repeated.status).toBe(200);
		const unchanged = await SELF.fetch('https://study.saneax.in/api/learning/hero', {
			headers: accessHeaders('hero-recovery@example.test'),
		});
		expect(((await unchanged.json()) as { hero: { totalXp: number } }).hero.totalXp).toBe(8);
	});

	it('adds a weekly streak bonus after seven completed plan days', async () => {
		const current = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Chemistry', {
			headers: accessHeaders('hero-streak@example.test'),
		});
		const currentBody = (await current.json()) as { assignment: { id: string } };
		const assignment = await env.DB.prepare(`SELECT template_id AS templateId FROM assignments WHERE id = ?`)
			.bind(currentBody.assignment.id)
			.first<{ templateId: string }>();
		const today = istToday();
		await env.DB.batch([
			env.DB.prepare(
				`INSERT INTO study_plans
				 (id, student_id, revision, start_date, end_date, weekday_minutes, weekend_minutes, rest_weekdays, change_reason)
				 VALUES ('hero-streak-plan', 'hero-streak', 1, ?, ?, 90, 120, '[]', 'initial')`,
			).bind(today, today),
			env.DB.prepare(
				`INSERT INTO study_plan_entries
				 (id, plan_id, student_id, scheduled_for, subject, sequence, template_id, allocated_minutes, position)
				 VALUES ('hero-streak-entry', 'hero-streak-plan', 'hero-streak', ?, 'Chemistry', 1, ?, 40, 0)`,
			).bind(today, assignment?.templateId),
			...Array.from({ length: 6 }, (_, index) =>
				env.DB.prepare(
					`INSERT INTO hero_xp_events
					 (id, student_id, event_type, points, event_date, dedupe_key, detail)
					 VALUES (?, 'hero-streak', 'daily_plan', 10, ?, ?, 'Completed the daily plan')`,
				).bind(`hero-streak-seed-${index + 1}`, dateBefore(today, 6 - index), `daily-seed-${index + 1}`),
			),
		]);
		const questions = await env.DB.prepare(
			`SELECT questions.id, questions.answer_json AS answerJson
			 FROM assignment_items JOIN questions ON questions.id = assignment_items.question_id
			 WHERE assignment_items.assignment_id = ? ORDER BY assignment_items.position`,
		)
			.bind(currentBody.assignment.id)
			.all<{ id: string; answerJson: string }>();
		for (const question of questions.results) {
			const saved = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${currentBody.assignment.id}/responses`, {
				method: 'PUT',
				headers: accessHeaders('hero-streak@example.test', true),
				body: JSON.stringify({ questionId: question.id, answer: JSON.parse(question.answerJson) }),
			});
			expect(saved.status).toBe(200);
		}
		const submitted = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${currentBody.assignment.id}/submit`, {
			method: 'POST',
			headers: accessHeaders('hero-streak@example.test'),
		});
		expect(submitted.status).toBe(200);

		const hero = await SELF.fetch('https://study.saneax.in/api/learning/hero', {
			headers: accessHeaders('hero-streak@example.test'),
		});
		const payload = (await hero.json()) as {
			hero: { totalXp: number; currentStreak: number; events: Array<{ type: string; points: number }> };
		};
		expect(payload.hero.totalXp).toBe(83);
		expect(payload.hero.currentStreak).toBe(7);
		expect(payload.hero.events).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'weekly_streak', points: 10 })]));
	});

	it('shows the linked learner Hero Path to the parent without a sibling leaderboard', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/parent/learners/hero-student/hero', {
			headers: accessHeaders(parentEmail),
		});
		expect(response.status).toBe(200);
		const payload = (await response.json()) as { learner: { id: string }; hero: { totalXp: number; rank: { name: string } } };
		expect(payload.learner.id).toBe('hero-student');
		expect(payload.hero.totalXp).toBe(18);
		expect(payload.hero.rank.name).toBe('Initiate');
		expect(JSON.stringify(payload)).not.toContain('leaderboard');

		const studentAttempt = await SELF.fetch('https://study.saneax.in/api/parent/learners/hero-student/hero', {
			headers: accessHeaders(studentEmail),
		});
		expect(studentAttempt.status).toBe(403);
	});

	it('lets a parent configure an individual privilege unlocked by XP', async () => {
		const created = await SELF.fetch('https://study.saneax.in/api/parent/learners/hero-student/hero/rewards', {
			method: 'POST',
			headers: accessHeaders(parentEmail, true),
			body: JSON.stringify({ title: 'Choose the weekend family activity', xpRequired: 15 }),
		});
		expect(created.status).toBe(201);
		const payload = (await created.json()) as { hero: { rewards: Array<{ title: string; xpRequired: number; unlocked: boolean }> } };
		expect(payload.hero.rewards).toEqual([{ title: 'Choose the weekend family activity', xpRequired: 15, unlocked: true }]);

		const studentAttempt = await SELF.fetch('https://study.saneax.in/api/parent/learners/hero-student/hero/rewards', {
			method: 'POST',
			headers: accessHeaders(studentEmail, true),
			body: JSON.stringify({ title: 'Unapproved reward', xpRequired: 1 }),
		});
		expect(studentAttempt.status).toBe(403);
	});
});
