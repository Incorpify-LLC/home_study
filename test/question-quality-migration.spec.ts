import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

beforeAll(async () => {
	const previous = env.TEST_MIGRATIONS.slice(0, -1);
	const qualityRelease = env.TEST_MIGRATIONS.slice(-1);
	await applyD1Migrations(env.DB, previous);
	await env.DB.batch([
		env.DB.prepare(
			`INSERT INTO users (id, role, display_name, email) VALUES ('migration-student-a', 'student', 'Student A', 'migration-a@example.test')`,
		),
		env.DB.prepare(
			`INSERT INTO users (id, role, display_name, email) VALUES ('migration-student-b', 'student', 'Student B', 'migration-b@example.test')`,
		),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level) VALUES ('migration-student-a', 'CISCE', 'VIII')`),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level) VALUES ('migration-student-b', 'CISCE', 'VIII')`),
		env.DB.prepare(
			`INSERT INTO study_plans
			 (id, student_id, revision, start_date, end_date, weekday_minutes, weekend_minutes, rest_weekdays, change_reason)
			 VALUES ('migration-plan-a', 'migration-student-a', 1, '2026-10-23', '2026-10-30', 90, 120, '[7]', 'initial')`,
		),
		env.DB.prepare(
			`INSERT INTO study_plans
			 (id, student_id, revision, start_date, end_date, weekday_minutes, weekend_minutes, rest_weekdays, change_reason)
			 VALUES ('migration-plan-b', 'migration-student-b', 1, '2026-10-23', '2026-10-30', 90, 120, '[7]', 'initial')`,
		),
		env.DB.prepare(
			`INSERT INTO study_plan_entries
			 (id, plan_id, student_id, scheduled_for, subject, sequence, template_id, allocated_minutes, position)
			 VALUES ('migration-entry-a', 'migration-plan-a', 'migration-student-a', '2026-10-23', 'Chemistry', 1,
			         'template-viii-chem-matter', 40, 0)`,
		),
		env.DB.prepare(
			`INSERT INTO study_plan_entries
			 (id, plan_id, student_id, scheduled_for, subject, sequence, template_id, allocated_minutes, position)
			 VALUES ('migration-entry-b', 'migration-plan-b', 'migration-student-b', '2026-10-23', 'Chemistry', 1,
			         'template-viii-chem-matter', 40, 0)`,
		),
		env.DB.prepare(
			`INSERT INTO assignments (id, student_id, assigned_for, status, estimated_minutes, template_id)
			 VALUES ('migration-assignment-b', 'migration-student-b', '2026-10-23', 'in_progress', 40,
			         'template-viii-chem-matter')`,
		),
	]);
	await applyD1Migrations(env.DB, qualityRelease);
});

describe('question quality migration', () => {
	it('moves untouched planned Chemistry work to v2 without changing an in-progress assignment', async () => {
		const rows = await env.DB.prepare(
			`SELECT study_plan_entries.id, study_plan_entries.template_id
			 FROM study_plan_entries
			 WHERE study_plan_entries.id IN ('migration-entry-a', 'migration-entry-b')
			 ORDER BY study_plan_entries.id`,
		).all<{ id: string; template_id: string }>();

		expect(rows.results).toEqual([
			{ id: 'migration-entry-a', template_id: 'template-viii-chem-matter-v2' },
			{ id: 'migration-entry-b', template_id: 'template-viii-chem-matter' },
		]);
	});
});
