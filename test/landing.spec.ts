import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('public landing page', () => {
	it('introduces the private family study workspace', async () => {
		const response = await SELF.fetch('https://study.saneax.in/');
		const page = await response.text();

		expect(response.status).toBe(200);
		expect(page).toContain('<title>Home Study</title>');
		expect(page).toContain('A calm place to learn, practise, and improve.');
		expect(page).toContain('Private family workspace');
	});

	it('does not expose student names or academic weaknesses publicly', async () => {
		const response = await SELF.fetch('https://study.saneax.in/');
		const page = (await response.text()).toLowerCase();

		for (const privateTerm of ['student-c', 'student-a', 'student-b', 'weak in']) {
			expect(page).not.toContain(privateTerm);
		}
	});
});
