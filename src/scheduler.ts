/**
 * Deterministic study scheduler.
 *
 * The engine turns a learner's outstanding chapters into a dated calendar that fits
 * the parent-set daily study minutes. It is a pure function: the same request always
 * produces the same calendar, so a reschedule can be recomputed at any time and
 * compared with what the learner already had.
 *
 * Rules that matter:
 * - a chapter is never split across days, so a day can finish under its budget;
 * - subjects rotate, so a learner carrying several subjects makes steady progress in all;
 * - rest weekdays carry no work at all;
 * - chapters that do not fit inside the horizon are reported as unscheduled instead of
 *   being silently dropped.
 */

export type ChapterRef = {
	subject: string;
	sequence: number;
	templateId: string;
	estimatedMinutes: number;
};

export type ScheduleRequest = {
	startDate: string;
	days: number;
	weekdayMinutes: number;
	weekendMinutes: number;
	restWeekdays: number[];
	pending: ChapterRef[];
	capacityOverrides?: Record<string, number>;
};

export type ScheduleEntry = {
	date: string;
	subject: string;
	sequence: number;
	templateId: string;
	minutes: number;
	position: number;
};

export type ScheduleDayTotal = {
	date: string;
	minutes: number;
	capacity: number;
};

export type ScheduleResult = {
	entries: ScheduleEntry[];
	dailyTotals: ScheduleDayTotal[];
	unscheduled: ChapterRef[];
	lastScheduledDate: string | null;
};

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isoWeekday(date: string): number {
	if (!DAY_PATTERN.test(date)) throw new Error(`Invalid ISO date: ${date}`);
	const parsed = new Date(`${date}T00:00:00.000Z`);
	if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid ISO date: ${date}`);
	return ((parsed.getUTCDay() + 6) % 7) + 1;
}

export function addDays(date: string, offset: number): string {
	const parsed = new Date(`${date}T00:00:00.000Z`);
	parsed.setUTCDate(parsed.getUTCDate() + offset);
	return parsed.toISOString().slice(0, 10);
}

function capacityFor(request: ScheduleRequest, date: string): number {
	const override = request.capacityOverrides?.[date];
	if (override !== undefined) return Math.max(0, Math.floor(override));
	if (request.restWeekdays.includes(isoWeekday(date))) return 0;
	return isoWeekday(date) >= 6 ? request.weekendMinutes : request.weekdayMinutes;
}

export function buildSchedule(request: ScheduleRequest): ScheduleResult {
	const queues = new Map<string, ChapterRef[]>();
	for (const chapter of request.pending) {
		const queue = queues.get(chapter.subject) ?? [];
		queue.push(chapter);
		queues.set(chapter.subject, queue);
	}
	const subjects = [...queues.keys()].sort();
	for (const subject of subjects) {
		queues.get(subject)?.sort((left, right) => left.sequence - right.sequence);
	}

	const cursors = new Map<string, number>(subjects.map((subject) => [subject, 0]));

	const entries: ScheduleEntry[] = [];
	const dailyTotals: ScheduleDayTotal[] = [];
	let rotation = 0;

	for (let offset = 0; offset < request.days; offset += 1) {
		const date = addDays(request.startDate, offset);
		const capacity = capacityFor(request, date);
		let remaining = capacity;
		let position = 0;

		let progressed = true;
		while (progressed && subjects.length > 0) {
			progressed = false;
			for (let step = 0; step < subjects.length; step += 1) {
				const index = (rotation + step) % subjects.length;
				const subject = subjects[index];
				const queue = queues.get(subject) ?? [];
				const cursor = cursors.get(subject) ?? 0;
				const chapter = queue[cursor];
				if (!chapter) continue;
				if (chapter.estimatedMinutes > remaining) continue;

				remaining -= chapter.estimatedMinutes;
				cursors.set(subject, cursor + 1);
				entries.push({
					date,
					subject,
					sequence: chapter.sequence,
					templateId: chapter.templateId,
					minutes: chapter.estimatedMinutes,
					position,
				});
				position += 1;
				rotation = (index + 1) % subjects.length;
				progressed = true;
				break;
			}
		}

		dailyTotals.push({ date, minutes: capacity - remaining, capacity });
	}

	const unscheduled: ChapterRef[] = [];
	for (const subject of subjects) {
		const queue = queues.get(subject) ?? [];
		const cursor = cursors.get(subject) ?? 0;
		unscheduled.push(...queue.slice(cursor));
	}

	return {
		entries,
		dailyTotals,
		unscheduled,
		lastScheduledDate: entries.at(-1)?.date ?? null,
	};
}
