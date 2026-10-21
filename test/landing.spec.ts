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

	it('contains no family identities, and no password form outside the demo panel', async () => {
		const response = await SELF.fetch('https://study.saneax.in/');
		const page = await response.text();
		const lower = page.toLowerCase();

		for (const privateTerm of ['@gmail.com', 'weak in']) {
			expect(lower).not.toContain(privateTerm);
		}
		// The family path stays code-based: no native family login endpoint.
		expect(lower).not.toContain('/api/login');

		// Password inputs exist only for the evaluation demo, and only inside its
		// panel, which is hidden until the page finds no session.
		const passwordFields = page.match(/type="password"/g) ?? [];
		expect(passwordFields).toHaveLength(2);
		const panel = page.slice(page.indexOf('id="demo-signin"'), page.indexOf('<footer'));
		expect(panel.match(/type="password"/g) ?? []).toHaveLength(2);
		expect(page).toContain('id="demo-signin" class="panel" hidden');
	});

	it('contains an accessible learning workflow and parent evidence view', async () => {
		const response = await SELF.fetch('https://study.saneax.in/');
		const page = await response.text();

		expect(page).toContain('id="learning-workspace"');
		expect(page).toContain('id="course-roadmap"');
		expect(page).toContain('id="question-form"');
		expect(page).toContain('id="submit-assignment"');
		expect(page).toContain('id="next-assignment"');
		expect(page).toContain('id="progress-view"');
		expect(page).toContain('Corrections');
		expect(page).toContain('Save answer');
		expect(page).not.toContain('Your first reviewed learning plan will appear here.');
	});

	it('uses the Cloudflare Access session and logout flow', async () => {
		const response = await SELF.fetch('https://study.saneax.in/');
		const page = await response.text();

		// The page routes its calls through one fetch wrapper, so the endpoint path is the contract.
		expect(page).toContain("'/api/session'");
		expect(page).toContain("window.location.assign('/cdn-cgi/access/logout')");
	});

	it('contains separate parent and student shells without account-management controls', async () => {
		const response = await SELF.fetch('https://study.saneax.in/');
		const page = await response.text();

		expect(page).toContain('<section id="dashboard" hidden>');
		expect(page).toContain('data-role="parent"');
		expect(page).toContain('data-role="student"');
		expect(page).toContain('id="student-list"');
		expect(page).toContain("'/api/students'");
		expect(page).toContain("result.user.role === 'parent'");
		expect(page).not.toContain('Add a learner');
		expect(page).not.toContain('Reset password');
	});

	it('exposes the study calendar controls and the exercise review view', async () => {
		const response = await SELF.fetch('https://study.saneax.in/');
		const page = await response.text();

		expect(page).toContain('id="plan-view"');
		expect(page).toContain('id="exercise-view"');
		expect(page).toContain('id="today-plan"');
		expect(page).toContain('Rest days');
		expect(page).toContain('Save hours and reschedule');
		expect(page).toContain('Rebuild calendar now');
		expect(page).toContain("'/api/learning/plan'");
		expect(page).toContain('/plan/reschedule');
		expect(page).toContain('/study-settings');
		expect(page).toContain('/exercises');
	});

	it('supports the evaluation demo learner and the reviewed interface', async () => {
		const response = await SELF.fetch('https://study.saneax.in/');
		const page = await response.text();

		// Demo learner controls.
		expect(page).toContain('id="demo-bar"');
		// The evaluation demo signs in with a password; the family uses Access OTP.
		expect(page).toContain('id="demo-signin"');
		expect(page).toContain('id="demo-signin-form"');
		expect(page).toContain('id="demo-enrol-form"');
		expect(page).toContain('id="demo-password"');
		expect(page).toContain('/api/auth/demo-login');
		expect(page).toContain('/api/auth/demo-enrol');
		expect(page).toContain("'/api/demo/classes'");
		expect(page).toContain("'/api/demo/class'");
		expect(page).toContain("'/api/demo/reset'");
		expect(page).toContain('Evaluation demo');
		expect(page).toContain('Start fresh when switching');
		expect(page).toContain('Clear this class');

		// Interface affordances added in the UI review.
		expect(page).toContain('id="today-progress"');
		expect(page).toContain('id="roadmap-progress"');
		expect(page).toContain('id="result-ring"');
		expect(page).toContain('data-field="answer-count"');
		expect(page).toContain('class="skip-link"');
		expect(page).toContain('prefers-reduced-motion');
		expect(page).toContain('prefers-color-scheme: dark');
	});
});
