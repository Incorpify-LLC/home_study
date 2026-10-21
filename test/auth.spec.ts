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
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES (?, 'student', ?, ?)`).bind(
			'student-a',
			'Student A',
			'student-a@example.test',
		),
	]);
});

function accessHeaders(email: string): HeadersInit {
	return { 'cf-access-test-email': email };
}

describe('Cloudflare Access identity', () => {
	it('returns anonymous state without a verified Access identity', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/session');
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ authenticated: false });
	});

	it.each([
		['parent-a@example.test', 'Parent A', 'parent'],
		['student-a@example.test', 'Student A', 'student'],
	])('maps the verified email %s to its private role', async (email, displayName, role) => {
		const response = await SELF.fetch('https://study.saneax.in/api/session', { headers: accessHeaders(email) });
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ authenticated: true, user: { displayName, role, demo: false } });
	});

	it('does not authenticate an Access email without an active application profile', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/session', {
			headers: accessHeaders('not-enrolled@example.test'),
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ authenticated: false });
	});

	it('removes native password login and logout APIs', async () => {
		for (const [path, method] of [
			['/api/login', 'POST'],
			['/api/logout', 'POST'],
		] as const) {
			const response = await SELF.fetch(`https://study.saneax.in${path}`, { method });
			expect(response.status).toBe(404);
		}
	});
});
