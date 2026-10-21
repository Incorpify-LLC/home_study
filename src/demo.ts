/**
 * Evaluation demo learner.
 *
 * One account (`is_demo = 1`) can sit in any class that has reviewed content and
 * work a chapter exactly as a child would: lesson, answers, save, submit,
 * corrections, calendar. Progress is kept per class, so a demonstration can
 * resume where the previous one stopped, and clearing a class is an explicit
 * choice rather than a side effect of switching.
 */

import { reschedulePlan, type PlanEnv } from './plan';

export type DemoEnv = PlanEnv;

export type DemoClass = {
	classLevel: string;
	examYear: number | null;
	subjects: string[];
	chapters: number;
};

export type DemoProgress = { completed: number; total: number };

export type DemoState = {
	current: { classLevel: string; examYear: number | null };
	classes: DemoClass[];
	progress: DemoProgress;
	progressByClass: Array<{ classLevel: string; completed: number }>;
};

const CLASS_ORDER: Record<string, number> = { VIII: 8, X: 10, XII: 12 };

export async function demoClasses(env: DemoEnv): Promise<DemoClass[]> {
	const result = await env.DB.prepare(
		`SELECT assignment_templates.class_level AS classLevel,
		        curriculum_topics.exam_year AS examYear,
		        assignment_templates.subject AS subject,
		        COUNT(*) AS chapters
		 FROM assignment_templates
		 JOIN learning_modules ON learning_modules.id = assignment_templates.module_id
		 JOIN curriculum_topics ON curriculum_topics.id = learning_modules.topic_id
		 WHERE assignment_templates.active = 1
		   AND assignment_templates.review_status = 'reviewed'
		   AND learning_modules.review_status = 'reviewed'
		   AND curriculum_topics.review_status = 'reviewed'
		 GROUP BY assignment_templates.class_level, curriculum_topics.exam_year, assignment_templates.subject
		 ORDER BY assignment_templates.class_level, assignment_templates.subject`,
	).all<{ classLevel: string; examYear: number | null; subject: string; chapters: number }>();

	const byClass = new Map<string, DemoClass>();
	for (const row of result.results) {
		const entry = byClass.get(row.classLevel) ?? {
			classLevel: row.classLevel,
			examYear: row.examYear,
			subjects: [],
			chapters: 0,
		};
		entry.subjects.push(row.subject);
		entry.chapters += row.chapters;
		byClass.set(row.classLevel, entry);
	}
	return [...byClass.values()]
		.map((entry) => ({ ...entry, subjects: [...entry.subjects].sort() }))
		.sort((left, right) => (CLASS_ORDER[left.classLevel] ?? 99) - (CLASS_ORDER[right.classLevel] ?? 99));
}

export async function demoState(env: DemoEnv, studentId: string): Promise<DemoState> {
	const classes = await demoClasses(env);
	const profile = await env.DB.prepare(`SELECT class_level AS classLevel, exam_year AS examYear FROM student_profiles WHERE user_id = ?`)
		.bind(studentId)
		.first<{ classLevel: string; examYear: number | null }>();
	if (!profile) throw new Error('Demo learner has no student profile.');

	// Progress is reported per class, so a reviewer can see what each class keeps.
	const completedRows = await env.DB.prepare(
		`SELECT assignment_templates.class_level AS classLevel, COUNT(*) AS completed
		 FROM assignments
		 JOIN assignment_templates ON assignment_templates.id = assignments.template_id
		 WHERE assignments.student_id = ?
		   AND assignments.status IN ('submitted', 'reviewed')
		 GROUP BY assignment_templates.class_level`,
	)
		.bind(studentId)
		.all<{ classLevel: string; completed: number }>();

	const progressByClass = classes.map((entry) => ({
		classLevel: entry.classLevel,
		completed: completedRows.results.find((row) => row.classLevel === entry.classLevel)?.completed ?? 0,
	}));
	const current = classes.find((entry) => entry.classLevel === profile.classLevel);
	const completed = progressByClass.find((entry) => entry.classLevel === profile.classLevel)?.completed ?? 0;

	return {
		current: { classLevel: profile.classLevel, examYear: profile.examYear },
		classes,
		progress: { completed, total: current?.chapters ?? 0 },
		progressByClass,
	};
}

/** Clears this learner's work, optionally restricted to one class. */
async function clearProgress(env: DemoEnv, studentId: string, classLevel: string | null): Promise<void> {
	// Order matters: mastery evidence and uploads point at attempts, and attempts
	// point at assignments, so the children are removed before their parents.
	const scopedAssignments = classLevel
		? `SELECT id FROM assignments WHERE student_id = ? AND template_id IN
		     (SELECT id FROM assignment_templates WHERE class_level = ?)`
		: `SELECT id FROM assignments WHERE student_id = ?`;
	const scopeArgs = classLevel ? [studentId, classLevel] : [studentId];

	await env.DB.batch([
		classLevel
			? env.DB.prepare(
					`DELETE FROM mastery_events
					 WHERE student_id = ?
					   AND topic_id IN (SELECT id FROM curriculum_topics WHERE class_level = ?)`,
				).bind(studentId, classLevel)
			: env.DB.prepare(`DELETE FROM mastery_events WHERE student_id = ?`).bind(studentId),
		env.DB.prepare(`DELETE FROM uploads WHERE attempt_id IN (SELECT id FROM attempts WHERE assignment_id IN (${scopedAssignments}))`).bind(
			...scopeArgs,
		),
		env.DB.prepare(`DELETE FROM attempts WHERE assignment_id IN (${scopedAssignments})`).bind(...scopeArgs),
		env.DB.prepare(`DELETE FROM assignment_responses WHERE assignment_id IN (${scopedAssignments})`).bind(...scopeArgs),
		env.DB.prepare(`DELETE FROM assignments WHERE id IN (${scopedAssignments})`).bind(...scopeArgs),
		env.DB.prepare(`DELETE FROM study_plans WHERE student_id = ?`).bind(studentId),
	]);
}

export async function switchDemoClass(
	env: DemoEnv,
	studentId: string,
	classLevel: string,
	options: { startFresh?: boolean } = {},
): Promise<DemoState> {
	const classes = await demoClasses(env);
	const target = classes.find((entry) => entry.classLevel === classLevel);
	if (!target) throw new Error(`Class ${classLevel} has no reviewed content.`);

	await env.DB.prepare(`UPDATE student_profiles SET class_level = ?, exam_year = ? WHERE user_id = ?`)
		.bind(target.classLevel, target.examYear, studentId)
		.run();

	// Kept by default so a demonstration can resume; clearing is an explicit choice.
	if (options.startFresh) await clearProgress(env, studentId, target.classLevel);

	await reschedulePlan(env, studentId, 'course_changed');
	return demoState(env, studentId);
}

export async function resetDemoProgress(env: DemoEnv, studentId: string): Promise<DemoState> {
	const profile = await env.DB.prepare(`SELECT class_level AS classLevel FROM student_profiles WHERE user_id = ?`)
		.bind(studentId)
		.first<{ classLevel: string }>();
	await clearProgress(env, studentId, profile?.classLevel ?? null);
	await reschedulePlan(env, studentId, 'initial');
	return demoState(env, studentId);
}
