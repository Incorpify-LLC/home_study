import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

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
