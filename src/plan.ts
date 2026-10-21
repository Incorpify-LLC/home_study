/**
 * Study plan service: persists parent-set study hours, generates the assessment
 * calendar, and re-schedules it whenever the plan inputs change.
 *
 * Any change to the plan inputs is expected to produce a new calendar:
 * hours changed, a subject added or finished, work completed, or work missed.
 * The calendar is always recomputed from the outstanding chapters, so nothing
 * is ever lost: unfinished work simply reappears on the next available day.
 */

import { addDays, buildSchedule, isoWeekday, type ChapterRef, type ScheduleEntry } from './scheduler';

export type PlanEnv = { DB: D1Database };

export type StudySettings = {
	weekdayMinutes: number;
	weekendMinutes: number;
	restWeekdays: number[];
	horizonDays: number;
};

export type PlanChangeReason = 'initial' | 'hours_changed' | 'course_changed' | 'roll_forward' | 'manual';

export type PlanDay = {
	date: string;
	capacityMinutes: number;
	allocatedMinutes: number;
	entries: Array<{
		subject: string;
		sequence: number;
		title: string;
		minutes: number;
		state: 'planned' | 'done' | 'missed';
		assignmentStatus: string;
	}>;
};

export type PlanView = {
	settings: StudySettings;
	plan: {
		id: string;
		revision: number;
		changeReason: PlanChangeReason;
		startDate: string;
		endDate: string;
		generatedAt: string;
		days: PlanDay[];
		unscheduled: Array<{ subject: string; sequence: number; title: string }>;
		totalPlannedMinutes: number;
	};
};

export const DEFAULT_SETTINGS: StudySettings = {
	weekdayMinutes: 120,
	weekendMinutes: 300,
	restWeekdays: [7],
	horizonDays: 28,
};

const MIN_MINUTES = 30;
const MAX_MINUTES = 480;
const MIN_HORIZON = 7;
const MAX_HORIZON = 90;

/** Today in the family's timezone (IST), which is what "today's work" means to a learner. */
export function istToday(now: number = Date.now()): string {
	return new Date(now + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function parseWeekdays(value: string): number[] {
	try {
		const parsed: unknown = JSON.parse(value);
		if (!Array.isArray(parsed)) return [...DEFAULT_SETTINGS.restWeekdays];
		const days = parsed.filter((day): day is number => Number.isInteger(day) && (day as number) >= 1 && (day as number) <= 7);
		return [...new Set(days)].sort((left, right) => left - right);
	} catch {
		return [...DEFAULT_SETTINGS.restWeekdays];
	}
}

export function validateSettings(input: unknown): { settings?: StudySettings; error?: string } {
	if (typeof input !== 'object' || input === null) return { error: 'Study settings must be an object.' };
	const candidate = input as Record<string, unknown>;
	const pick = (key: string, fallback: number, min: number, max: number, label: string): number | string => {
		const value = candidate[key];
		if (value === undefined) return fallback;
		if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
			return `${label} must be a whole number of minutes between ${min} and ${max}.`;
		}
		return value as number;
	};
	const weekdayMinutes = pick('weekdayMinutes', DEFAULT_SETTINGS.weekdayMinutes, MIN_MINUTES, MAX_MINUTES, 'Weekday study time');
	if (typeof weekdayMinutes === 'string') return { error: weekdayMinutes };
	const weekendMinutes = pick('weekendMinutes', DEFAULT_SETTINGS.weekendMinutes, MIN_MINUTES, MAX_MINUTES, 'Weekend study time');
	if (typeof weekendMinutes === 'string') return { error: weekendMinutes };
	const horizonDays = pick('horizonDays', DEFAULT_SETTINGS.horizonDays, MIN_HORIZON, MAX_HORIZON, 'Planning horizon');
	if (typeof horizonDays === 'string') return { error: horizonDays };
	const restRaw = candidate.restWeekdays;
	const restWeekdays = restRaw === undefined ? [...DEFAULT_SETTINGS.restWeekdays] : restRaw;
	if (!Array.isArray(restWeekdays) || restWeekdays.some((day) => !Number.isInteger(day) || (day as number) < 1 || (day as number) > 7)) {
		return { error: 'Rest days must be a list of weekday numbers from 1 (Monday) to 7 (Sunday).' };
	}
	return {
		settings: { weekdayMinutes, weekendMinutes, horizonDays, restWeekdays: [...new Set(restWeekdays as number[])].sort((a, b) => a - b) },
	};
}

export async function loadSettings(env: PlanEnv, studentId: string): Promise<StudySettings> {
	const row = await env.DB.prepare(
		`SELECT weekday_minutes, weekend_minutes, rest_weekdays, horizon_days
		 FROM study_settings
		 WHERE student_id = ?`,
	)
		.bind(studentId)
		.first<{ weekday_minutes: number; weekend_minutes: number; rest_weekdays: string; horizon_days: number }>();
	if (!row) return { ...DEFAULT_SETTINGS };
	return {
		weekdayMinutes: row.weekday_minutes,
		weekendMinutes: row.weekend_minutes,
		restWeekdays: parseWeekdays(row.rest_weekdays),
		horizonDays: row.horizon_days,
	};
}

export async function saveSettings(env: PlanEnv, studentId: string, parentId: string, settings: StudySettings): Promise<void> {
	await env.DB.prepare(
		`INSERT INTO study_settings
		   (student_id, weekday_minutes, weekend_minutes, rest_weekdays, horizon_days, updated_at, updated_by)
		 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
		 ON CONFLICT (student_id) DO UPDATE SET
		   weekday_minutes = excluded.weekday_minutes,
		   weekend_minutes = excluded.weekend_minutes,
		   rest_weekdays = excluded.rest_weekdays,
		   horizon_days = excluded.horizon_days,
		   updated_at = CURRENT_TIMESTAMP,
		   updated_by = excluded.updated_by`,
	)
		.bind(
			studentId,
			settings.weekdayMinutes,
			settings.weekendMinutes,
			JSON.stringify(settings.restWeekdays),
			settings.horizonDays,
			parentId,
		)
		.run();
}

/** Reviewed chapters this learner still has to finish, across every subject they carry. */
export async function pendingChapters(env: PlanEnv, studentId: string): Promise<ChapterRef[]> {
	const result = await env.DB.prepare(
		`SELECT assignment_templates.id AS templateId,
		        assignment_templates.subject,
		        assignment_templates.sequence,
		        assignment_templates.estimated_minutes AS estimatedMinutes,
		        assignment_templates.title
		 FROM student_profiles
		 JOIN assignment_templates ON assignment_templates.class_level = student_profiles.class_level
		 JOIN learning_modules ON learning_modules.id = assignment_templates.module_id
		 JOIN curriculum_topics ON curriculum_topics.id = learning_modules.topic_id
		 LEFT JOIN assignments
		   ON assignments.template_id = assignment_templates.id
		  AND assignments.student_id = student_profiles.user_id
		  AND assignments.status IN ('submitted', 'reviewed')
		 WHERE student_profiles.user_id = ?
		   AND assignments.id IS NULL
		   AND assignment_templates.active = 1
		   AND assignment_templates.review_status = 'reviewed'
		   AND learning_modules.review_status = 'reviewed'
		   AND curriculum_topics.review_status = 'reviewed'
		   AND (curriculum_topics.board IS NULL OR lower(curriculum_topics.board) = lower(student_profiles.board))
		   AND (curriculum_topics.exam_year IS NULL OR curriculum_topics.exam_year = student_profiles.exam_year)
		 ORDER BY assignment_templates.subject, assignment_templates.sequence`,
	)
		.bind(studentId)
		.all<ChapterRef & { title: string }>();
	return result.results;
}

function capacityForDate(settings: StudySettings, date: string): number {
	if (settings.restWeekdays.includes(isoWeekday(date))) return 0;
	return isoWeekday(date) >= 6 ? settings.weekendMinutes : settings.weekdayMinutes;
}

async function minutesAlreadyDoneToday(env: PlanEnv, studentId: string, today: string): Promise<number> {
	const row = await env.DB.prepare(
		`SELECT COALESCE(SUM(assignment_templates.estimated_minutes), 0) AS minutes
		 FROM assignments
		 JOIN assignment_templates ON assignment_templates.id = assignments.template_id
		 WHERE assignments.student_id = ?
		   AND assignments.status IN ('submitted', 'reviewed')
		   AND substr(COALESCE(assignments.submitted_at, assignments.created_at), 1, 10) = ?`,
	)
		.bind(studentId, today)
		.first<{ minutes: number }>();
	return row?.minutes ?? 0;
}

export async function reschedulePlan(
	env: PlanEnv,
	studentId: string,
	reason: PlanChangeReason,
	settingsOverride?: StudySettings,
): Promise<PlanView> {
	const settings = settingsOverride ?? (await loadSettings(env, studentId));
	const pending = await pendingChapters(env, studentId);
	const today = istToday();
	const capacityToday = Math.max(0, capacityForDate(settings, today) - (await minutesAlreadyDoneToday(env, studentId, today)));

	const schedule = buildSchedule({
		startDate: today,
		days: settings.horizonDays,
		weekdayMinutes: settings.weekdayMinutes,
		weekendMinutes: settings.weekendMinutes,
		restWeekdays: settings.restWeekdays,
		pending: pending.map((chapter) => ({
			subject: chapter.subject,
			sequence: chapter.sequence,
			templateId: chapter.templateId,
			estimatedMinutes: chapter.estimatedMinutes,
		})),
		capacityOverrides: { [today]: capacityToday },
	});

	const previous = await env.DB.prepare(`SELECT COALESCE(MAX(revision), 0) AS revision FROM study_plans WHERE student_id = ?`)
		.bind(studentId)
		.first<{ revision: number }>();
	const revision = (previous?.revision ?? 0) + 1;
	const planId = crypto.randomUUID();
	const endDate = addDays(today, settings.horizonDays - 1);

	const statements = [
		env.DB.prepare(`UPDATE study_plans SET active = 0 WHERE student_id = ? AND active = 1`).bind(studentId),
		env.DB.prepare(
			`INSERT INTO study_plans
			   (id, student_id, revision, start_date, end_date, weekday_minutes, weekend_minutes, rest_weekdays, change_reason, active)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
		).bind(
			planId,
			studentId,
			revision,
			today,
			endDate,
			settings.weekdayMinutes,
			settings.weekendMinutes,
			JSON.stringify(settings.restWeekdays),
			reason,
		),
		...schedule.entries.map((entry: ScheduleEntry) =>
			env.DB.prepare(
				`INSERT INTO study_plan_entries
				   (id, plan_id, student_id, scheduled_for, subject, sequence, template_id, allocated_minutes, position)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			).bind(
				crypto.randomUUID(),
				planId,
				studentId,
				entry.date,
				entry.subject,
				entry.sequence,
				entry.templateId,
				entry.minutes,
				entry.position,
			),
		),
	];
	await env.DB.batch(statements);

	return planView(env, studentId);
}

type PlanEntryRow = {
	date: string;
	subject: string;
	sequence: number;
	title: string;
	minutes: number;
	position: number;
	assignmentStatus: string;
};

export async function planView(env: PlanEnv, studentId: string): Promise<PlanView & { learner?: unknown }> {
	const plan = await env.DB.prepare(
		`SELECT id, revision, start_date, end_date, weekday_minutes, weekend_minutes, rest_weekdays, change_reason, generated_at
		 FROM study_plans
		 WHERE student_id = ? AND active = 1`,
	)
		.bind(studentId)
		.first<{
			id: string;
			revision: number;
			start_date: string;
			end_date: string;
			weekday_minutes: number;
			weekend_minutes: number;
			rest_weekdays: string;
			change_reason: PlanChangeReason;
			generated_at: string;
		}>();
	if (!plan) throw new Error('No active study plan.');

	const settings: StudySettings = {
		weekdayMinutes: plan.weekday_minutes,
		weekendMinutes: plan.weekend_minutes,
		restWeekdays: parseWeekdays(plan.rest_weekdays),
		horizonDays: Math.max(1, daysBetween(plan.start_date, plan.end_date) + 1),
	};

	const entries = await env.DB.prepare(
		`SELECT study_plan_entries.scheduled_for AS date,
		        study_plan_entries.subject,
		        study_plan_entries.sequence,
		        study_plan_entries.allocated_minutes AS minutes,
		        study_plan_entries.position,
		        assignment_templates.title,
		        COALESCE(assignments.status, 'not_started') AS assignmentStatus
		 FROM study_plan_entries
		 JOIN assignment_templates ON assignment_templates.id = study_plan_entries.template_id
		 LEFT JOIN assignments
		   ON assignments.template_id = study_plan_entries.template_id
		  AND assignments.student_id = study_plan_entries.student_id
		 WHERE study_plan_entries.plan_id = ?
		 ORDER BY study_plan_entries.scheduled_for, study_plan_entries.position`,
	)
		.bind(plan.id)
		.all<PlanEntryRow>();

	const today = istToday();
	const byDate = new Map<string, PlanEntryRow[]>();
	for (const entry of entries.results) {
		const list = byDate.get(entry.date) ?? [];
		list.push(entry);
		byDate.set(entry.date, list);
	}

	const days: PlanDay[] = [];
	for (let offset = 0; offset < settings.horizonDays; offset += 1) {
		const date = addDays(plan.start_date, offset);
		const dayEntries = (byDate.get(date) ?? []).map((entry) => ({
			subject: entry.subject,
			sequence: entry.sequence,
			title: entry.title,
			minutes: entry.minutes,
			assignmentStatus: entry.assignmentStatus,
			state:
				entry.assignmentStatus === 'submitted' || entry.assignmentStatus === 'reviewed'
					? ('done' as const)
					: date < today
						? ('missed' as const)
						: ('planned' as const),
		}));
		days.push({
			date,
			capacityMinutes: capacityForDate(settings, date),
			allocatedMinutes: dayEntries.reduce((sum, entry) => sum + entry.minutes, 0),
			entries: dayEntries,
		});
	}

	const scheduled = new Set(entries.results.map((entry) => `${entry.subject}#${entry.sequence}`));
	const pending = await pendingChapters(env, studentId);
	const unscheduled = (pending as Array<ChapterRef & { title?: string }>)
		.filter((chapter) => !scheduled.has(`${chapter.subject}#${chapter.sequence}`))
		.map((chapter) => ({ subject: chapter.subject, sequence: chapter.sequence, title: chapter.title ?? '' }));

	return {
		settings,
		plan: {
			id: plan.id,
			revision: plan.revision,
			changeReason: plan.change_reason,
			startDate: plan.start_date,
			endDate: plan.end_date,
			generatedAt: plan.generated_at,
			days,
			unscheduled,
			totalPlannedMinutes: entries.results.reduce((sum, entry) => sum + entry.minutes, 0),
		},
	};
}

function daysBetween(startDate: string, endDate: string): number {
	const start = Date.parse(`${startDate}T00:00:00.000Z`);
	const end = Date.parse(`${endDate}T00:00:00.000Z`);
	return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

/**
 * Returns the current calendar, regenerating it when the inputs have moved on:
 * a new subject appeared, a chapter was finished or dropped, or the horizon expired.
 */
export async function ensureFreshPlan(env: PlanEnv, studentId: string): Promise<PlanView> {
	const current = await env.DB.prepare(`SELECT revision, start_date, end_date FROM study_plans WHERE student_id = ? AND active = 1`)
		.bind(studentId)
		.first<{ revision: number; start_date: string; end_date: string }>();
	if (!current) return reschedulePlan(env, studentId, 'initial');

	const today = istToday();
	if (current.end_date < today) return reschedulePlan(env, studentId, 'roll_forward');

	const [pending, scheduled] = await Promise.all([
		pendingChapters(env, studentId),
		env.DB.prepare(
			`SELECT study_plan_entries.template_id AS templateId
			 FROM study_plan_entries
			 JOIN study_plans ON study_plans.id = study_plan_entries.plan_id
			 WHERE study_plans.student_id = ? AND study_plans.active = 1`,
		)
			.bind(studentId)
			.all<{ templateId: string }>(),
	]);
	const pendingIds = new Set(pending.map((chapter) => chapter.templateId));
	const scheduledIds = new Set(scheduled.results.map((row) => row.templateId));
	const sameUniverse = pendingIds.size === scheduledIds.size && [...pendingIds].every((id) => scheduledIds.has(id));
	if (!sameUniverse) return reschedulePlan(env, studentId, 'course_changed');

	return planView(env, studentId);
}

/** The chapter a learner should be working on today for a subject, if the calendar has one. */
export async function todaysTemplateIds(env: PlanEnv, studentId: string): Promise<Map<string, string>> {
	const today = istToday();
	const result = await env.DB.prepare(
		`SELECT study_plan_entries.subject, study_plan_entries.template_id AS templateId
		 FROM study_plan_entries
		 JOIN study_plans ON study_plans.id = study_plan_entries.plan_id
		 LEFT JOIN assignments
		   ON assignments.template_id = study_plan_entries.template_id
		  AND assignments.student_id = study_plan_entries.student_id
		 WHERE study_plans.student_id = ?
		   AND study_plans.active = 1
		   AND study_plan_entries.scheduled_for = ?
		   AND (assignments.status IS NULL OR assignments.status NOT IN ('submitted', 'reviewed'))
		 ORDER BY study_plan_entries.position`,
	)
		.bind(studentId, today)
		.all<{ subject: string; templateId: string }>();
	const map = new Map<string, string>();
	for (const row of result.results) if (!map.has(row.subject)) map.set(row.subject, row.templateId);
	return map;
}

/** Parent-facing exercise review: the reviewed questions, correct answers and rationales. */
export async function exerciseForParent(
	env: PlanEnv,
	studentId: string,
	subject: string,
	sequence: number,
): Promise<Record<string, unknown> | null> {
	const template = await env.DB.prepare(
		`SELECT assignment_templates.id AS templateId,
		        assignment_templates.title,
		        assignment_templates.instructions,
		        assignment_templates.estimated_minutes AS estimatedMinutes,
		        learning_modules.overview,
		        learning_modules.key_points_json AS keyPointsJson,
		        learning_modules.worked_example_json AS workedExampleJson,
		        learning_modules.practice_advice AS practiceAdvice
		 FROM student_profiles
		 JOIN assignment_templates ON assignment_templates.class_level = student_profiles.class_level
		 JOIN learning_modules ON learning_modules.id = assignment_templates.module_id
		 JOIN curriculum_topics ON curriculum_topics.id = learning_modules.topic_id
		 WHERE student_profiles.user_id = ?
		   AND assignment_templates.subject = ?
		   AND assignment_templates.sequence = ?
		   AND assignment_templates.active = 1
		   AND assignment_templates.review_status = 'reviewed'
		   AND learning_modules.review_status = 'reviewed'
		   AND curriculum_topics.review_status = 'reviewed'
		   AND (curriculum_topics.board IS NULL OR lower(curriculum_topics.board) = lower(student_profiles.board))
		   AND (curriculum_topics.exam_year IS NULL OR curriculum_topics.exam_year = student_profiles.exam_year)`,
	)
		.bind(studentId, subject, sequence)
		.first<{
			templateId: string;
			title: string;
			instructions: string;
			estimatedMinutes: number;
			overview: string;
			keyPointsJson: string;
			workedExampleJson: string;
			practiceAdvice: string;
		}>();
	if (!template) return null;

	const questions = await env.DB.prepare(
		`SELECT questions.id,
		        questions.question_type AS type,
		        questions.prompt,
		        questions.options_json AS optionsJson,
		        questions.answer_json AS answerJson,
		        questions.rationale,
		        questions.requires_rough_work AS requiresRoughWork,
		        assignment_items.position,
		        assignment_responses.answer_json AS responseJson,
		        (SELECT COALESCE(attempts.final_score, attempts.objective_score)
		           FROM attempts
		          WHERE attempts.assignment_id = assignment_items.assignment_id
		            AND attempts.question_id = assignment_items.question_id
		          ORDER BY attempts.submitted_at DESC
		          LIMIT 1) AS score,
		        assignments.status AS assignmentStatus,
		        assignments.id AS assignmentId
		 FROM assignment_template_items
		 JOIN questions ON questions.id = assignment_template_items.question_id
		 LEFT JOIN assignments
		   ON assignments.template_id = assignment_template_items.template_id
		  AND assignments.student_id = ?
		 LEFT JOIN assignment_items
		   ON assignment_items.assignment_id = assignments.id
		  AND assignment_items.question_id = assignment_template_items.question_id
		 LEFT JOIN assignment_responses
		   ON assignment_responses.assignment_id = assignment_items.assignment_id
		  AND assignment_responses.question_id = assignment_template_items.question_id
		 WHERE assignment_template_items.template_id = ?
		 ORDER BY assignment_template_items.position`,
	)
		.bind(studentId, template.templateId)
		.all<{
			id: string;
			type: string;
			prompt: string;
			optionsJson: string | null;
			answerJson: string;
			rationale: string;
			requiresRoughWork: number;
			position: number;
			responseJson: string | null;
			score: number | null;
			assignmentStatus: string | null;
			assignmentId: string | null;
		}>();

	return {
		subject,
		sequence,
		title: template.title,
		instructions: template.instructions,
		estimatedMinutes: template.estimatedMinutes,
		status: questions.results[0]?.assignmentStatus ?? 'not_started',
		lesson: {
			overview: template.overview,
			keyPoints: JSON.parse(template.keyPointsJson) as string[],
			workedExample: JSON.parse(template.workedExampleJson) as Record<string, unknown>,
			practiceAdvice: template.practiceAdvice,
		},
		questions: questions.results.map((question) => ({
			id: question.id,
			type: question.type,
			prompt: question.prompt,
			options: question.optionsJson ? (JSON.parse(question.optionsJson) as unknown) : null,
			correctAnswer: JSON.parse(question.answerJson) as unknown,
			rationale: question.rationale,
			requiresRoughWork: question.requiresRoughWork === 1,
			position: question.position,
			studentAnswer: question.responseJson ? (JSON.parse(question.responseJson) as unknown) : null,
			score: question.score,
		})),
	};
}
