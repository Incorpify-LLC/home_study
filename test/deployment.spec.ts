import { env, SELF } from 'cloudflare:test';
import { env as processEnv } from 'node:process';
import { describe, expect, it } from 'vitest';

const remoteSmoke = processEnv.REMOTE_SMOKE === '1' ? describe : describe.skip;

remoteSmoke('deployed Worker', () => {
	it('exposes the health contract', async () => {
		const baseUrl = processEnv.STUDY_BASE_URL ?? 'https://study.saneax.in';
		const response = await fetch(`${baseUrl}/api/health`);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			service: 'home-study',
			status: 'ok',
		});
	});
});

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
