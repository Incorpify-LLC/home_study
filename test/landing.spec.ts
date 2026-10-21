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
		expect(page).not.toContain('/api/login');
		expect(page).not.toContain('type="password"');
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
