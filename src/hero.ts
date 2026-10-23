import { istToday } from './plan';

export interface HeroEnv {
	DB: D1Database;
}

const RANKS = [
	{ name: 'Initiate', minimumXp: 0 },
	{ name: 'Challenger', minimumXp: 100 },
	{ name: 'Rising Hero', minimumXp: 250 },
	{ name: 'Guardian', minimumXp: 500 },
	{ name: 'Elite Guardian', minimumXp: 900 },
	{ name: 'Legend', minimumXp: 1500 },
] as const;

function rankFor(totalXp: number): { name: string; minimumXp: number; next: { name: string; minimumXp: number } | null } {
	let index = 0;
	for (let candidate = 1; candidate < RANKS.length; candidate += 1) {
		if (totalXp >= RANKS[candidate].minimumXp) index = candidate;
	}
	const rank = RANKS[index];
	const next = RANKS[index + 1] ?? null;
	return { name: rank.name, minimumXp: rank.minimumXp, next };
}

async function insertXpEvent(
	env: HeroEnv,
	studentId: string,
	event: {
		type: 'daily_plan' | 'corrections' | 'on_schedule' | 'weekly_streak' | 'recovery';
		points: number;
		assignmentId?: string;
		planEntryId?: string;
		date: string;
		dedupeKey: string;
		detail: string;
	},
): Promise<boolean> {
	const result = await env.DB.prepare(
		`INSERT OR IGNORE INTO hero_xp_events
		 (id, student_id, event_type, points, assignment_id, plan_entry_id, event_date, dedupe_key, detail)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	)
		.bind(
			crypto.randomUUID(),
			studentId,
			event.type,
			event.points,
			event.assignmentId ?? null,
			event.planEntryId ?? null,
			event.date,
			event.dedupeKey,
			event.detail,
		)
		.run();
	return (result.meta.changes ?? 0) > 0;
}

export async function awardSubmissionXp(env: HeroEnv, studentId: string, assignmentId: string): Promise<void> {
	const scheduled = await env.DB.prepare(
		`SELECT study_plan_entries.id AS planEntryId,
		        study_plan_entries.plan_id AS planId,
		        study_plan_entries.template_id AS templateId,
		        study_plan_entries.scheduled_for AS scheduledFor
		 FROM assignments
		 JOIN study_plan_entries
		   ON study_plan_entries.student_id = assignments.student_id
		  AND study_plan_entries.template_id = assignments.template_id
		 JOIN study_plans ON study_plans.id = study_plan_entries.plan_id
		 WHERE assignments.id = ?
		   AND assignments.student_id = ?
		   AND study_plans.active = 1
		 LIMIT 1`,
	)
		.bind(assignmentId, studentId)
		.first<{ planEntryId: string; planId: string; templateId: string; scheduledFor: string }>();
	if (!scheduled) return;

	const today = istToday();
	if (today > scheduled.scheduledFor) {
		await syncRecoveryQuests(env, studentId);
		const quest = await env.DB.prepare(
			`SELECT id FROM hero_recovery_quests
			 WHERE student_id = ? AND template_id = ? AND status = 'open'`,
		)
			.bind(studentId, scheduled.templateId)
			.first<{ id: string }>();
		if (quest) {
			await env.DB.prepare(
				`UPDATE hero_recovery_quests SET status = 'completed', resolved_at = CURRENT_TIMESTAMP
				 WHERE id = ? AND status = 'open'`,
			)
				.bind(quest.id)
				.run();
			await insertXpEvent(env, studentId, {
				type: 'recovery',
				points: 8,
				assignmentId,
				planEntryId: scheduled.planEntryId,
				date: today,
				dedupeKey: `recovery:${assignmentId}`,
				detail: 'Completed a Recovery Quest',
			});
		}
		return;
	}
	if (today <= scheduled.scheduledFor) {
		await insertXpEvent(env, studentId, {
			type: 'on_schedule',
			points: 3,
			assignmentId,
			planEntryId: scheduled.planEntryId,
			date: scheduled.scheduledFor,
			dedupeKey: `on-schedule:${assignmentId}`,
			detail: 'Submitted on schedule',
		});
	}

	const unfinished = await env.DB.prepare(
		`SELECT COUNT(*) AS count
		 FROM study_plan_entries
		 LEFT JOIN assignments
		   ON assignments.student_id = study_plan_entries.student_id
		  AND assignments.template_id = study_plan_entries.template_id
		  AND assignments.status IN ('submitted', 'reviewed')
		 WHERE study_plan_entries.plan_id = ?
		   AND study_plan_entries.scheduled_for = ?
		   AND assignments.id IS NULL`,
	)
		.bind(scheduled.planId, scheduled.scheduledFor)
		.first<{ count: number }>();
	if ((unfinished?.count ?? 0) === 0) {
		const completedDay = await insertXpEvent(env, studentId, {
			type: 'daily_plan',
			points: 10,
			assignmentId,
			planEntryId: scheduled.planEntryId,
			date: scheduled.scheduledFor,
			dedupeKey: `daily-plan:${scheduled.planId}:${scheduled.scheduledFor}`,
			detail: 'Completed the daily plan',
		});
		if (completedDay) {
			await syncRecoveryQuests(env, studentId);
			const [days, misses] = await Promise.all([
				env.DB.prepare(`SELECT COUNT(*) AS count FROM hero_xp_events WHERE student_id = ? AND event_type = 'daily_plan'`)
					.bind(studentId)
					.first<{ count: number }>(),
				env.DB.prepare(`SELECT COUNT(*) AS count FROM hero_recovery_quests WHERE student_id = ? AND status = 'open'`)
					.bind(studentId)
					.first<{ count: number }>(),
			]);
			const completedDays = days?.count ?? 0;
			if (completedDays > 0 && completedDays % 7 === 0 && (misses?.count ?? 0) < 3) {
				await insertXpEvent(env, studentId, {
					type: 'weekly_streak',
					points: 10,
					assignmentId,
					planEntryId: scheduled.planEntryId,
					date: scheduled.scheduledFor,
					dedupeKey: `weekly-streak:${completedDays / 7}`,
					detail: 'Completed a seven-day streak',
				});
			}
		}
	}
}

async function syncRecoveryQuests(env: HeroEnv, studentId: string): Promise<void> {
	const today = istToday();
	const missing = await env.DB.prepare(
		`SELECT study_plan_entries.id AS planEntryId,
		        study_plan_entries.template_id AS templateId,
		        study_plan_entries.scheduled_for AS scheduledFor
		 FROM study_plan_entries
		 LEFT JOIN assignments
		   ON assignments.student_id = study_plan_entries.student_id
		  AND assignments.template_id = study_plan_entries.template_id
		  AND assignments.status IN ('submitted', 'reviewed')
		 LEFT JOIN hero_day_status
		   ON hero_day_status.student_id = study_plan_entries.student_id
		  AND hero_day_status.date = study_plan_entries.scheduled_for
		 WHERE study_plan_entries.student_id = ?
		   AND study_plan_entries.scheduled_for < ?
		   AND assignments.id IS NULL
		   AND hero_day_status.student_id IS NULL`,
	)
		.bind(studentId, today)
		.all<{ planEntryId: string; templateId: string; scheduledFor: string }>();
	if (missing.results.length === 0) return;
	await env.DB.batch(
		missing.results.map((entry) =>
			env.DB.prepare(
				`INSERT OR IGNORE INTO hero_recovery_quests
				 (id, student_id, template_id, plan_entry_id, scheduled_for)
				 VALUES (?, ?, ?, ?, ?)`,
			).bind(crypto.randomUUID(), studentId, entry.templateId, entry.planEntryId, entry.scheduledFor),
		),
	);
}

export async function heroSummary(env: HeroEnv, studentId: string): Promise<Record<string, unknown>> {
	await syncRecoveryQuests(env, studentId);
	const total = await env.DB.prepare(`SELECT COALESCE(SUM(points), 0) AS totalXp FROM hero_xp_events WHERE student_id = ?`)
		.bind(studentId)
		.first<{ totalXp: number }>();
	const events = await env.DB.prepare(
		`SELECT event_type AS type, points, event_date AS date, detail
		 FROM hero_xp_events
		 WHERE student_id = ?
		 ORDER BY event_date DESC, created_at DESC, id DESC
		 LIMIT 20`,
	)
		.bind(studentId)
		.all<{ type: string; points: number; date: string; detail: string }>();
	const recoveryQuests = await env.DB.prepare(
		`SELECT hero_recovery_quests.id,
		        hero_recovery_quests.scheduled_for AS date,
		        hero_recovery_quests.status,
		        assignment_templates.subject,
		        assignment_templates.sequence,
		        assignment_templates.title
		 FROM hero_recovery_quests
		 JOIN assignment_templates ON assignment_templates.id = hero_recovery_quests.template_id
		 WHERE hero_recovery_quests.student_id = ?
		 ORDER BY hero_recovery_quests.scheduled_for, assignment_templates.subject, assignment_templates.sequence`,
	)
		.bind(studentId)
		.all<{ id: string; date: string; status: string; subject: string; sequence: number; title: string }>();
	const currentStreakResult = await env.DB.prepare(
		`SELECT COUNT(*) AS count FROM hero_xp_events WHERE student_id = ? AND event_type = 'daily_plan'`,
	)
		.bind(studentId)
		.first<{ count: number }>();
	const rewards = await env.DB.prepare(
		`SELECT title, xp_required AS xpRequired
		 FROM hero_rewards
		 WHERE student_id = ? AND active = 1
		 ORDER BY xp_required, created_at, id`,
	)
		.bind(studentId)
		.all<{ title: string; xpRequired: number }>();
	const unresolvedMisses = recoveryQuests.results.filter((quest) => quest.status === 'open').length;
	const currentStreak = currentStreakResult?.count ?? 0;
	const totalXp = total?.totalXp ?? 0;
	return {
		totalXp,
		rank: rankFor(totalXp),
		currentStreak,
		unresolvedMisses,
		streakBonusPaused: unresolvedMisses >= 3,
		cosmeticUnlockPaused: unresolvedMisses >= 3,
		recoveryQuests: recoveryQuests.results,
		rewards: rewards.results.map((reward) => ({ ...reward, unlocked: totalXp >= reward.xpRequired && unresolvedMisses < 3 })),
		events: events.results,
	};
}

export async function addHeroReward(env: HeroEnv, studentId: string, parentId: string, title: string, xpRequired: number): Promise<void> {
	await env.DB.prepare(
		`INSERT INTO hero_rewards (id, student_id, title, xp_required, created_by)
		 VALUES (?, ?, ?, ?, ?)`,
	)
		.bind(crypto.randomUUID(), studentId, title, xpRequired, parentId)
		.run();
}

export async function markExcusedDay(
	env: HeroEnv,
	studentId: string,
	parentId: string,
	date: string,
	reason: 'school_exam' | 'illness' | 'travel' | 'rest' | 'other',
	note: string | null,
): Promise<void> {
	await env.DB.batch([
		env.DB.prepare(
			`INSERT INTO hero_day_status (student_id, date, status, reason, note, marked_by, updated_at)
			 VALUES (?, ?, 'excused', ?, ?, ?, CURRENT_TIMESTAMP)
			 ON CONFLICT (student_id, date) DO UPDATE SET
			   status = 'excused', reason = excluded.reason, note = excluded.note,
			   marked_by = excluded.marked_by, updated_at = CURRENT_TIMESTAMP`,
		).bind(studentId, date, reason, note, parentId),
		env.DB.prepare(
			`UPDATE hero_recovery_quests
			 SET status = 'excused', resolved_at = CURRENT_TIMESTAMP
			 WHERE student_id = ? AND scheduled_for = ? AND status = 'open'`,
		).bind(studentId, date),
	]);
}

export async function completeCorrections(env: HeroEnv, studentId: string, assignmentId: string): Promise<number | null> {
	const assignment = await env.DB.prepare(
		`SELECT assignments.id,
		        EXISTS (
		          SELECT 1 FROM attempts
		          WHERE attempts.assignment_id = assignments.id
		            AND COALESCE(attempts.final_score, attempts.objective_score, 0) < 1
		        ) AS hasCorrections
		 FROM assignments
		 WHERE assignments.id = ?
		   AND assignments.student_id = ?
		   AND assignments.status IN ('submitted', 'reviewed')`,
	)
		.bind(assignmentId, studentId)
		.first<{ id: string; hasCorrections: number }>();
	if (!assignment || assignment.hasCorrections !== 1) return null;
	const inserted = await insertXpEvent(env, studentId, {
		type: 'corrections',
		points: 5,
		assignmentId,
		date: istToday(),
		dedupeKey: `corrections:${assignmentId}`,
		detail: 'Completed corrections',
	});
	return inserted ? 5 : 0;
}
