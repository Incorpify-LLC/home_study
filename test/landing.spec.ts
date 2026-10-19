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

	it('offers a family sign-in form without requiring an email address', async () => {
		const response = await SELF.fetch('https://study.saneax.in/');
		const page = await response.text();

		expect(page).toContain('<form id="login-form"');
		expect(page).toContain('name="identifier"');
		expect(page).toContain('name="password"');
		expect(page).toContain('type="password"');
		expect(page).toContain("fetch('/api/login'");
		expect(page).toContain('autocomplete="username"');
		expect(page).toContain('autocomplete="current-password"');
	});
});
