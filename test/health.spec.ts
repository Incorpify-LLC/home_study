import { applyD1Migrations, env, SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe('health API', () => {
	it('returns a stable readiness contract', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/health');

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('application/json');
		expect(await response.json()).toEqual({
			service: 'home-study',
			status: 'ok',
			version: '0.1.0',
		});
	});

	it('does not cache readiness responses', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/health');

		expect(response.headers.get('cache-control')).toBe('no-store');
	});
});

describe('unknown API route', () => {
	it('returns a JSON 404 without leaking internals', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/unknown');

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			error: 'not_found',
			message: 'The requested API route does not exist.',
		});
	});
});

describe('session API', () => {
	it('returns the anonymous session state without caching it', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/session');

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({ authenticated: false });
	});
});
