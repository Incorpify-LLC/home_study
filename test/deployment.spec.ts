import { env, SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('Cloudflare resource contract', () => {
	it('provides database and private upload bindings to the Worker', () => {
		expect(env.DB).toBeDefined();
		expect(env.ROUGH_WORK).toBeDefined();
	});

	it('serves assets and APIs through the same Worker', async () => {
		const [page, health] = await Promise.all([SELF.fetch('https://study.saneax.in/'), SELF.fetch('https://study.saneax.in/api/health')]);

		expect(page.status).toBe(200);
		expect(health.status).toBe(200);
	});
});
