import { applyD1Migrations, env, SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
	await env.DB.prepare(
		`INSERT INTO users (id, role, display_name, email, login_identifier, password_hash)
		 VALUES (?, ?, ?, ?, ?, ?)`,
	)
		.bind(
			'user-parent-a',
			'parent',
			'Parent A',
			'parent-a@example.test',
			'parent-a',
			'pbkdf2-sha256$100000$MDEyMzQ1Njc4OWFiY2RlZg$CQEF03iMraucElCfobodRqkaFY16F3mxFDIvP9WoJcs',
		)
		.run();
});

describe('family credential login', () => {
	it('creates a secure server-side session for valid credentials', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				identifier: 'parent-a',
				password: 'correct horse battery staple',
			}),
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			authenticated: true,
			user: { displayName: 'Parent A', role: 'parent' },
		});

		const cookie = response.headers.get('set-cookie');
		expect(cookie).toMatch(/^home_study_session=[^;]+;/);
		expect(cookie).toContain('HttpOnly');
		expect(cookie).toContain('Secure');
		expect(cookie).toContain('SameSite=Strict');
		expect(cookie).toContain('Path=/');
		expect(cookie).toContain('Max-Age=28800');

		const row = await env.DB.prepare('SELECT token_hash, user_id, expires_at, revoked_at FROM sessions WHERE user_id = ?')
			.bind('user-parent-a')
			.first<{ token_hash: string; user_id: string; expires_at: string; revoked_at: string | null }>();

		expect(row?.user_id).toBe('user-parent-a');
		expect(row?.token_hash).toMatch(/^[a-f0-9]{64}$/);
		expect(row?.revoked_at).toBeNull();
		expect(row?.expires_at).toBeTruthy();
		expect(cookie).not.toContain(row?.token_hash ?? 'missing-session-row');
	});

	it('resolves an unexpired session from its opaque cookie', async () => {
		const loginResponse = await SELF.fetch('https://study.saneax.in/api/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				identifier: 'parent-a',
				password: 'correct horse battery staple',
			}),
		});
		const cookie = loginResponse.headers.get('set-cookie');
		expect(cookie).toBeTruthy();

		const response = await SELF.fetch('https://study.saneax.in/api/session', {
			headers: { cookie: cookie ?? '' },
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			authenticated: true,
			user: { displayName: 'Parent A', role: 'parent' },
		});
	});

	it.each([
		['unknown account', 'missing@example.test', 'correct horse battery staple'],
		['incorrect password', 'parent-a', 'incorrect password'],
	])('returns the same generic error for an %s', async (_caseName, identifier, password) => {
		const response = await SELF.fetch('https://study.saneax.in/api/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ identifier, password }),
		});

		expect(response.status).toBe(401);
		expect(response.headers.get('set-cookie')).toBeNull();
		expect(await response.json()).toEqual({
			error: 'invalid_credentials',
			message: 'The identifier or password is incorrect.',
		});
	});

	it('revokes the current session on sign-out', async () => {
		const loginResponse = await SELF.fetch('https://study.saneax.in/api/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				identifier: 'parent-a',
				password: 'correct horse battery staple',
			}),
		});
		const cookie = loginResponse.headers.get('set-cookie') ?? '';

		const logoutResponse = await SELF.fetch('https://study.saneax.in/api/logout', {
			method: 'POST',
			headers: { cookie },
		});

		expect(logoutResponse.status).toBe(204);
		expect(logoutResponse.headers.get('set-cookie')).toContain('home_study_session=;');
		expect(logoutResponse.headers.get('set-cookie')).toContain('Max-Age=0');

		const sessionResponse = await SELF.fetch('https://study.saneax.in/api/session', {
			headers: { cookie },
		});
		expect(await sessionResponse.json()).toEqual({ authenticated: false });
	});

	it('rejects oversized credentials before attempting authentication', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ identifier: 'a'.repeat(129), password: 'b'.repeat(257) }),
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: 'invalid_request',
			message: 'The sign-in request is invalid.',
		});
	});

	it('returns the generic sign-in error for an account with a corrupt stored hash', async () => {
		await env.DB.prepare(
			`INSERT INTO users (id, role, display_name, login_identifier, password_hash)
			 VALUES (?, ?, ?, ?, ?)`,
		)
			.bind('user-parent-corrupt', 'parent', 'Corrupt Hash', 'corrupt-a', 'pbkdf2-sha256$210000$###invalid-base64###$###')
			.run();

		const response = await SELF.fetch('https://study.saneax.in/api/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ identifier: 'corrupt-a', password: 'correct horse battery staple' }),
		});

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			error: 'invalid_credentials',
			message: 'The identifier or password is incorrect.',
		});
	});

	it('rejects a stored hash above the Workers PBKDF2 iteration cap without crashing', async () => {
		await env.DB.prepare(
			`INSERT INTO users (id, role, display_name, login_identifier, password_hash)
			 VALUES (?, ?, ?, ?, ?)`,
		)
			.bind(
				'user-parent-high-iterations',
				'parent',
				'High Iterations',
				'high-iterations-a',
				'pbkdf2-sha256$210000$MDEyMzQ1Njc4OWFiY2RlZg$H_ZMdkjDEDpZ4T7DlMYQs7RkF9UgyowFSsi_pzKxi-s',
			)
			.run();

		const response = await SELF.fetch('https://study.saneax.in/api/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ identifier: 'high-iterations-a', password: 'correct horse battery staple' }),
		});

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			error: 'invalid_credentials',
			message: 'The identifier or password is incorrect.',
		});
	});

	it('rate limits repeated login attempts for one actor and identifier', async () => {
		const request = () =>
			SELF.fetch('https://study.saneax.in/api/login', {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					'cf-connecting-ip': '192.0.2.10',
				},
				body: JSON.stringify({ identifier: 'limited-a', password: 'incorrect password' }),
			});

		for (let attempt = 0; attempt < 5; attempt += 1) {
			expect((await request()).status).toBe(401);
		}
		const limited = await request();
		expect(limited.status).toBe(429);
		expect(limited.headers.get('retry-after')).toBe('60');
		expect(await limited.json()).toEqual({
			error: 'rate_limited',
			message: 'Too many sign-in attempts. Please wait before trying again.',
		});
	});
});
