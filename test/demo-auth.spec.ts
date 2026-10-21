import { applyD1Migrations, env, SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

const studentEmail = 'student-auth@example.test';
const demoPassphrase = 'evaluation-passphrase-1';
const enrolCode = 'one-time-enrolment-code';

function jsonHeaders(body: unknown, extra: Record<string, string> = {}): HeadersInit {
	return { 'content-type': 'application/json', ...extra };
}

async function enrol(identifier: string, code: string, password = demoPassphrase) {
	return SELF.fetch('https://study.saneax.in/api/auth/demo-enrol', {
		method: 'POST',
		headers: jsonHeaders({}),
		body: JSON.stringify({ identifier, code, password }),
	});
}

async function login(identifier: string, password: string) {
	return SELF.fetch('https://study.saneax.in/api/auth/demo-login', {
		method: 'POST',
		headers: jsonHeaders({}),
		body: JSON.stringify({ identifier, password }),
	});
}

function cookieFrom(response: Response): string {
	const header = response.headers.get('set-cookie') ?? '';
	return header.split(';')[0];
}

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
	await env.DB.batch([
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('student-auth', 'student', 'Student Auth', ?)`).bind(
			studentEmail,
		),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-auth', 'CISCE', 'X', 2027)`),
		env.DB.prepare(`UPDATE users SET login_identifier = 'student-auth' WHERE id = 'student-auth'`),
		// One-time enrolment codes, exactly as an operator would seed them.
		env.DB.prepare(`INSERT INTO demo_enrolment (id, identifier, code_hash) VALUES ('enrol-student', 'demo-student', ?)`).bind(
			await sha256Hex(enrolCode),
		),
		env.DB.prepare(`INSERT INTO demo_enrolment (id, identifier, code_hash) VALUES ('enrol-parent', 'demo-parent', ?)`).bind(
			await sha256Hex(enrolCode),
		),
	]);
});

async function sha256Hex(value: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

describe('demo credential sign-in', () => {
	it('reports no session without a cookie', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/session');
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ authenticated: false });
	});

	it('refuses sign-in before the account is enrolled', async () => {
		const response = await login('demo-student', demoPassphrase);
		expect(response.status).toBe(403);
		expect(((await response.json()) as { error: string }).error).toBe('enrolment_required');
	});

	it('refuses enrolment with the wrong one-time code', async () => {
		const response = await enrol('demo-student', 'not-the-code');
		expect(response.status).toBe(403);
	});

	it('refuses enrolment for an identity that is not a demo account', async () => {
		await env.DB.prepare(`INSERT INTO demo_enrolment (id, identifier, code_hash) VALUES ('enrol-real', 'student-auth', ?)`)
			.bind(await sha256Hex(enrolCode))
			.run();
		const response = await enrol('student-auth', enrolCode);
		expect(response.status).toBe(403);
	});

	it('enrols once and then signs in with the password', async () => {
		const enrolled = await enrol('demo-student', enrolCode);
		expect(enrolled.status).toBe(200);

		// The code is single use.
		expect((await enrol('demo-student', enrolCode)).status).toBe(403);

		const signedIn = await login('demo-student', demoPassphrase);
		expect(signedIn.status).toBe(200);
		const cookie = cookieFrom(signedIn);
		expect(cookie).toContain('home_study_session=');

		const session = await SELF.fetch('https://study.saneax.in/api/session', { headers: { cookie } });
		expect(await session.json()).toEqual({
			authenticated: true,
			user: { displayName: 'Demo Learner', role: 'student', demo: true },
		});

		// The cookie is enough for the learning APIs the browser check drives.
		const current = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Physics', { headers: { cookie } });
		expect(current.status).toBe(200);
		const assignment = (await current.json()) as { assignment: { classLevel: string; subject: string } };
		expect(assignment.assignment.classLevel).toBe('X');
		expect(assignment.assignment.subject).toBe('Physics');
	});

	it('signs the demo parent in and shows the demo learner', async () => {
		expect((await enrol('demo-parent', enrolCode)).status).toBe(200);
		const signedIn = await login('demo-parent', demoPassphrase);
		expect(signedIn.status).toBe(200);
		const cookie = cookieFrom(signedIn);

		const session = await SELF.fetch('https://study.saneax.in/api/session', { headers: { cookie } });
		expect(await session.json()).toEqual({
			authenticated: true,
			user: { displayName: 'Demo Parent', role: 'parent', demo: true },
		});

		const students = await SELF.fetch('https://study.saneax.in/api/students', { headers: { cookie } });
		expect(students.status).toBe(200);
		const body = (await students.json()) as { students: Array<{ id: string }> };
		expect(body.students.map((student) => student.id)).toEqual(['demo-student']);
	});

	it('ignores a cookie session belonging to a non-demo identity', async () => {
		const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
		const token = btoa(String.fromCharCode(...tokenBytes))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
		const tokenHash = await sha256Hex(token);
		await env.DB.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, 'student-auth', ?)`)
			.bind(tokenHash, new Date(Date.now() + 3600_000).toISOString())
			.run();

		const session = await SELF.fetch('https://study.saneax.in/api/session', {
			headers: { cookie: `home_study_session=${token}` },
		});
		expect(await session.json()).toEqual({ authenticated: false });
	});

	it('rejects a wrong password and locks out after repeated failures', async () => {
		// demo-parent is used here so the happy path above stays untouched.
		const wrong = await login('demo-parent', 'definitely-not-it');
		expect(wrong.status).toBe(401);
		expect((await wrong.json()) as { error: string }).toMatchObject({ error: 'invalid_credentials' });

		let limited = false;
		for (let attempt = 0; attempt < 8; attempt += 1) {
			const response = await login('demo-parent', 'definitely-not-it');
			if (response.status === 429) limited = true;
		}
		expect(limited).toBe(true);

		// Even the right password is refused while the lockout stands.
		expect((await login('demo-parent', demoPassphrase)).status).toBe(429);
	});

	it('signs out by revoking the session', async () => {
		const signedIn = await login('demo-student', demoPassphrase);
		const cookie = cookieFrom(signedIn);
		const out = await SELF.fetch('https://study.saneax.in/api/auth/logout', { method: 'POST', headers: { cookie } });
		expect(out.status).toBe(204);
		expect(out.headers.get('set-cookie') ?? '').toContain('Max-Age=0');

		const session = await SELF.fetch('https://study.saneax.in/api/session', { headers: { cookie } });
		expect(await session.json()).toEqual({ authenticated: false });
	});
});
