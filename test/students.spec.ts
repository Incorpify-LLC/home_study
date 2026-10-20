import { applyD1Migrations, env, SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
	await env.DB.batch([
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES (?, 'parent', ?, ?)`).bind(
			'parent-a',
			'Parent A',
			'parent-a@example.test',
		),
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES (?, 'parent', ?, ?)`).bind(
			'parent-b',
			'Parent B',
			'parent-b@example.test',
		),
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES (?, 'student', ?, ?)`).bind(
			'student-a',
			'Student A',
			'student-a@example.test',
		),
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES (?, 'student', ?, ?)`).bind(
			'student-b',
			'Student B',
			'student-b@example.test',
		),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-a', 'CISCE', 'VIII', 2027)`),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-b', 'CISCE', 'IX', 2028)`),
		env.DB.prepare(`INSERT INTO parent_students (parent_id, student_id) VALUES ('parent-a', 'student-a')`),
		env.DB.prepare(`INSERT INTO parent_students (parent_id, student_id) VALUES ('parent-b', 'student-b')`),
	]);
});

function accessHeaders(email: string): HeadersInit {
	return { 'cf-access-test-email': email };
}

describe('OTP-only student access', () => {
	it('requires a mapped Cloudflare Access identity to list students', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/students');
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			error: 'not_authenticated',
			message: 'A valid Cloudflare Access session is required.',
		});
	});

	it('forbids a student from listing family accounts', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/students', {
			headers: accessHeaders('student-a@example.test'),
		});
		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: 'forbidden', message: 'This action is available only to a parent.' });
	});

	it('returns only the students linked to the authenticated parent', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/students', {
			headers: accessHeaders('parent-a@example.test'),
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			students: [
				{
					id: 'student-a',
					displayName: 'Student A',
					classLevel: 'VIII',
					board: 'CISCE',
					examYear: 2027,
				},
			],
		});
	});

	it('does not expose an API for creating or resetting logins', async () => {
		const parentHeaders = accessHeaders('parent-a@example.test');
		const create = await SELF.fetch('https://study.saneax.in/api/students', { method: 'POST', headers: parentHeaders });
		const reset = await SELF.fetch('https://study.saneax.in/api/students/student-a/password', {
			method: 'PUT',
			headers: parentHeaders,
		});
		expect(create.status).toBe(404);
		expect(reset.status).toBe(404);
	});
});
