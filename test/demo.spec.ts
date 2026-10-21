import { applyD1Migrations, env, SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

const demoEmail = 'private-address@example.test';
const studentEmail = 'student-demo@example.test';
const parentEmail = 'parent-demo@example.test';

function accessHeaders(email: string, json = false): HeadersInit {
	return {
		'cf-access-test-email': email,
		...(json ? { 'content-type': 'application/json' } : {}),
	};
}

type ClassChoice = {
	classLevel: string;
	examYear: number | null;
	subjects: string[];
	chapters: number;
};

async function demoClasses(): Promise<ClassChoice[]> {
	const response = await SELF.fetch('https://study.saneax.in/api/demo/classes', { headers: accessHeaders(demoEmail) });
	expect(response.status).toBe(200);
	const body = (await response.json()) as { classes: ClassChoice[]; current: { classLevel: string; examYear: number | null } };
	return body.classes;
}

async function roadmapSubjects(): Promise<Array<{ subject: string; total: number; completed: number }>> {
	const response = await SELF.fetch('https://study.saneax.in/api/learning/roadmaps', { headers: accessHeaders(demoEmail) });
	expect(response.status).toBe(200);
	const body = (await response.json()) as {
		tracks: Array<{ subject: string; total: number; completed: number }>;
	};
	return body.tracks;
}

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
	await env.DB.batch([
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('parent-demo', 'parent', 'Parent Demo', ?)`).bind(
			parentEmail,
		),
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('student-demo', 'student', 'Student Demo', ?)`).bind(
			studentEmail,
		),
		env.DB.prepare(`INSERT INTO student_profiles (user_id, board, class_level, exam_year) VALUES ('student-demo', 'CISCE', 'VIII', NULL)`),
		env.DB.prepare(`INSERT INTO parent_students (parent_id, student_id) VALUES ('parent-demo', 'student-demo')`),
		// Mirrors production, where the demo learner is linked to the family parent
		// so the parent side of a demonstration can be reviewed as well.
		env.DB.prepare(`INSERT OR IGNORE INTO parent_students (parent_id, student_id) VALUES ('parent-demo', 'demo-student')`),
	]);
});

describe('demo learner identity', () => {
	it('announces itself as a demo account in the session', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/session', { headers: accessHeaders(demoEmail) });
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			authenticated: true,
			user: { displayName: 'Demo Learner', role: 'student', demo: true },
		});
	});

	it('marks a real student as not a demo', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/session', { headers: accessHeaders(studentEmail) });
		const body = (await response.json()) as { user: { demo: boolean } };
		expect(body.user.demo).toBe(false);
	});

	it('lists every class the demo learner can act as', async () => {
		const classes = await demoClasses();
		expect(classes.map((entry) => entry.classLevel)).toEqual(['VIII', 'X', 'XII']);
		const classTen = classes.find((entry) => entry.classLevel === 'X');
		expect(classTen?.examYear).toBe(2027);
		expect(classTen?.subjects.sort()).toEqual(['Mathematics', 'Physics']);
		expect(classTen?.chapters).toBe(30);
		const classEight = classes.find((entry) => entry.classLevel === 'VIII');
		expect(classEight?.examYear).toBeNull();
		expect(classEight?.chapters).toBe(19);
	});

	it('is refused to real students, parents and anonymous callers', async () => {
		const asStudent = await SELF.fetch('https://study.saneax.in/api/demo/classes', { headers: accessHeaders(studentEmail) });
		expect(asStudent.status).toBe(403);
		const asParent = await SELF.fetch('https://study.saneax.in/api/demo/classes', { headers: accessHeaders(parentEmail) });
		expect(asParent.status).toBe(403);
		const anonymous = await SELF.fetch('https://study.saneax.in/api/demo/classes');
		expect(anonymous.status).toBe(401);
	});
});

describe('demo learner works a chapter like a child', () => {
	it('starts as a Class X learner with two subjects and no progress', async () => {
		const tracks = await roadmapSubjects();
		expect(tracks.map((track) => track.subject).sort()).toEqual(['Mathematics', 'Physics']);
		expect(tracks.every((track) => track.completed === 0)).toBe(true);
		const physics = tracks.find((track) => track.subject === 'Physics');
		expect(physics?.total).toBe(12);
	});

	it('answers a whole chapter, submits it and reads the corrections', async () => {
		const current = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Physics', {
			headers: accessHeaders(demoEmail),
		});
		expect(current.status).toBe(200);
		const assignment = (await current.json()) as {
			assignment: { id: string; sequence: number; questions: Array<{ id: string; type: string; options: Array<{ id: string }> | null }> };
		};
		expect(assignment.assignment.sequence).toBe(1);

		for (const question of assignment.assignment.questions) {
			const saved = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${assignment.assignment.id}/responses`, {
				method: 'PUT',
				headers: accessHeaders(demoEmail, true),
				body: JSON.stringify({
					questionId: question.id,
					answer: question.type === 'single_choice' ? { choice: question.options?.[0]?.id ?? 'a' } : { value: 1 },
					confidence: 3,
				}),
			});
			expect(saved.status).toBe(200);
		}

		const submitted = await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${assignment.assignment.id}/submit`, {
			method: 'POST',
			headers: accessHeaders(demoEmail),
		});
		expect(submitted.status).toBe(200);
		const result = (await submitted.json()) as {
			result: { earned: number; possible: number; corrections: Array<{ questionId: string; rationale: string }> };
			rescheduled: boolean;
		};
		expect(result.result.possible).toBe(assignment.assignment.questions.length);
		expect(result.result.corrections.length).toBe(assignment.assignment.questions.length);
		expect(result.rescheduled).toBe(true);

		const tracks = await roadmapSubjects();
		expect(tracks.find((track) => track.subject === 'Physics')?.completed).toBe(1);
	});
});

describe('demo learner switches class and resets', () => {
	it('acts as a Class VIII learner after switching', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/demo/class', {
			method: 'POST',
			headers: accessHeaders(demoEmail, true),
			body: JSON.stringify({ classLevel: 'VIII' }),
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as { current: { classLevel: string; examYear: number | null }; progress: { completed: number } };
		expect(body.current).toEqual({ classLevel: 'VIII', examYear: null });
		expect(body.progress.completed).toBe(0);

		const tracks = await roadmapSubjects();
		expect(tracks.map((track) => track.subject).sort()).toEqual(['Mathematics', 'Physics']);
		expect(tracks.find((track) => track.subject === 'Physics')?.total).toBe(8);
		expect(tracks.every((track) => track.completed === 0)).toBe(true);
	});

	it('rejects a class with no reviewed content', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/demo/class', {
			method: 'POST',
			headers: accessHeaders(demoEmail, true),
			body: JSON.stringify({ classLevel: 'IX' }),
		});
		expect(response.status).toBe(400);
	});

	it('resets progress while staying in the chosen class', async () => {
		const current = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Mathematics', {
			headers: accessHeaders(demoEmail),
		});
		const assignment = (await current.json()) as {
			assignment: { id: string; questions: Array<{ id: string; type: string }> };
		};
		for (const question of assignment.assignment.questions) {
			await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${assignment.assignment.id}/responses`, {
				method: 'PUT',
				headers: accessHeaders(demoEmail, true),
				body: JSON.stringify({
					questionId: question.id,
					answer: question.type === 'single_choice' ? { choice: 'a' } : { value: 1 },
					confidence: 2,
				}),
			});
		}
		await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${assignment.assignment.id}/submit`, {
			method: 'POST',
			headers: accessHeaders(demoEmail),
		});
		expect((await roadmapSubjects()).find((track) => track.subject === 'Mathematics')?.completed).toBe(1);

		const reset = await SELF.fetch('https://study.saneax.in/api/demo/reset', {
			method: 'POST',
			headers: accessHeaders(demoEmail),
		});
		expect(reset.status).toBe(200);
		const body = (await reset.json()) as { current: { classLevel: string }; progress: { completed: number } };
		expect(body.current.classLevel).toBe('VIII');
		expect(body.progress.completed).toBe(0);

		const tracks = await roadmapSubjects();
		expect(tracks.every((track) => track.completed === 0)).toBe(true);

		const leftovers = await env.DB.prepare(
			`SELECT COUNT(*) AS total
			 FROM assignments
			 JOIN assignment_templates ON assignment_templates.id = assignments.template_id
			 WHERE assignments.student_id = 'demo-student' AND assignment_templates.class_level = 'VIII'`,
		).first<{ total: number }>();
		expect(leftovers?.total).toBe(0);
	});

	it('refuses class switching and reset for a real student', async () => {
		const switchClass = await SELF.fetch('https://study.saneax.in/api/demo/class', {
			method: 'POST',
			headers: accessHeaders(studentEmail, true),
			body: JSON.stringify({ classLevel: 'X' }),
		});
		expect(switchClass.status).toBe(403);
		const reset = await SELF.fetch('https://study.saneax.in/api/demo/reset', {
			method: 'POST',
			headers: accessHeaders(studentEmail),
		});
		expect(reset.status).toBe(403);
	});

	it('leaves the real learner alone when the demo resets', async () => {
		const before = await env.DB.prepare(`SELECT COUNT(*) AS total FROM student_profiles WHERE user_id = 'student-demo'`).first<{
			total: number;
		}>();
		expect(before?.total).toBe(1);
	});

	it("keeps each class's progress and lets the reviewer choose to clear it", async () => {
		// Work one Class X chapter, then switch to Class VIII and work one there.
		await SELF.fetch('https://study.saneax.in/api/demo/class', {
			method: 'POST',
			headers: accessHeaders(demoEmail, true),
			body: JSON.stringify({ classLevel: 'X', startFresh: true }),
		});
		const physics = await SELF.fetch('https://study.saneax.in/api/learning/current?subject=Physics', {
			headers: accessHeaders(demoEmail),
		});
		const assignment = (await physics.json()) as {
			assignment: { id: string; questions: Array<{ id: string; type: string }> };
		};
		for (const question of assignment.assignment.questions) {
			await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${assignment.assignment.id}/responses`, {
				method: 'PUT',
				headers: accessHeaders(demoEmail, true),
				body: JSON.stringify({
					questionId: question.id,
					answer: question.type === 'single_choice' ? { choice: 'a' } : { value: 1 },
					confidence: 3,
				}),
			});
		}
		await SELF.fetch(`https://study.saneax.in/api/learning/assignments/${assignment.assignment.id}/submit`, {
			method: 'POST',
			headers: accessHeaders(demoEmail),
		});

		// Switching keeps progress by default.
		const switched = await SELF.fetch('https://study.saneax.in/api/demo/class', {
			method: 'POST',
			headers: accessHeaders(demoEmail, true),
			body: JSON.stringify({ classLevel: 'VIII' }),
		});
		expect(switched.status).toBe(200);
		const switchedBody = (await switched.json()) as {
			current: { classLevel: string };
			progress: { completed: number; total: number };
			progressByClass: Array<{ classLevel: string; completed: number }>;
		};
		expect(switchedBody.current.classLevel).toBe('VIII');
		expect(switchedBody.progressByClass.find((entry) => entry.classLevel === 'X')?.completed).toBe(1);
		expect(switchedBody.progress.completed).toBe(0);

		// Coming back to Class X shows the earlier chapter still done.
		const back = await SELF.fetch('https://study.saneax.in/api/demo/class', {
			method: 'POST',
			headers: accessHeaders(demoEmail, true),
			body: JSON.stringify({ classLevel: 'X' }),
		});
		const backBody = (await back.json()) as { current: { classLevel: string }; progress: { completed: number } };
		expect(backBody.progress.completed).toBe(1);

		// Starting fresh is a choice: it clears only the class being entered.
		const fresh = await SELF.fetch('https://study.saneax.in/api/demo/class', {
			method: 'POST',
			headers: accessHeaders(demoEmail, true),
			body: JSON.stringify({ classLevel: 'X', startFresh: true }),
		});
		const freshBody = (await fresh.json()) as {
			progress: { completed: number };
			progressByClass: Array<{ classLevel: string; completed: number }>;
		};
		expect(freshBody.progress.completed).toBe(0);
		expect(freshBody.progressByClass.find((entry) => entry.classLevel === 'X')?.completed).toBe(0);
	});

	it("appears in the linked parent's learner list", async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/students', {
			headers: accessHeaders(parentEmail),
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as { students: Array<{ id: string; displayName: string; classLevel: string }> };
		const demo = body.students.find((student) => student.id === 'demo-student');
		expect(demo).toBeDefined();
		expect(demo?.displayName).toBe('Demo Learner');
		// The parent can also open the demo learner's evidence and exercises.
		const progress = await SELF.fetch('https://study.saneax.in/api/students/demo-student/progress', {
			headers: accessHeaders(parentEmail),
		});
		expect(progress.status).toBe(200);
	});
});
