import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('Access-protected application shell', () => {
	it('introduces the private family study workspace', async () => {
		const response = await SELF.fetch('https://study.saneax.in/');
		const page = await response.text();

		expect(response.status).toBe(200);
		expect(page).toContain('<title>Home Study</title>');
		expect(page).toContain('Private family workspace');
		expect(page).toContain('Checking secure access');
	});

	it('contains no family identities or native password form', async () => {
		const response = await SELF.fetch('https://study.saneax.in/');
		const page = (await response.text()).toLowerCase();

		for (const privateTerm of ['@gmail.com', 'weak in']) {
			expect(page).not.toContain(privateTerm);
		}
		expect(page).not.toContain('<form');
		expect(page).not.toContain('/api/login');
		expect(page).not.toContain('type="password"');
	});

	it('uses the Cloudflare Access session and logout flow', async () => {
		const response = await SELF.fetch('https://study.saneax.in/');
		const page = await response.text();

		expect(page).toContain("fetch('/api/session'");
		expect(page).toContain("window.location.assign('/cdn-cgi/access/logout')");
	});

	it('contains separate parent and student shells without account-management controls', async () => {
		const response = await SELF.fetch('https://study.saneax.in/');
		const page = await response.text();

		expect(page).toContain('<section id="dashboard" hidden>');
		expect(page).toContain('data-role="parent"');
		expect(page).toContain('data-role="student"');
		expect(page).toContain('id="student-list"');
		expect(page).toContain("fetch('/api/students'");
		expect(page).toContain("result.user.role === 'parent'");
		expect(page).not.toContain('Add a learner');
		expect(page).not.toContain('Reset password');
	});
});
