import { describe, expect, it } from 'vitest';
import { buildSchedule, isoWeekday, type ChapterRef } from '../src/scheduler';

// 2026-10-19 is a Monday, so these fixtures stay readable.
const MONDAY = '2026-10-19';
const SATURDAY = '2026-10-24';
const SUNDAY = '2026-10-25';

function chapters(subject: string, count: number, minutes = 60, prefix = 'template'): ChapterRef[] {
	return Array.from({ length: count }, (_, index) => ({
		subject,
		sequence: index + 1,
		templateId: `${prefix}-${subject.toLowerCase()}-${index + 1}`,
		estimatedMinutes: minutes,
	}));
}

describe('scheduler calendar arithmetic', () => {
	it('maps ISO dates to Monday-first weekday numbers', () => {
		expect(isoWeekday(MONDAY)).toBe(1);
		expect(isoWeekday(SATURDAY)).toBe(6);
		expect(isoWeekday(SUNDAY)).toBe(7);
		expect(isoWeekday('2026-10-26')).toBe(1);
	});
});

describe('buildSchedule', () => {
	it('never exceeds the weekday or weekend minute budget', () => {
		const result = buildSchedule({
			startDate: MONDAY,
			days: 14,
			weekdayMinutes: 120,
			weekendMinutes: 300,
			restWeekdays: [],
			pending: [...chapters('Mathematics', 6), ...chapters('Physics', 6)],
		});

		for (const day of result.dailyTotals) {
			expect(day.minutes).toBeLessThanOrEqual(day.capacity);
		}
		const saturday = result.dailyTotals.find((day) => day.date === SATURDAY);
		const monday = result.dailyTotals.find((day) => day.date === MONDAY);
		expect(saturday?.capacity).toBe(300);
		expect(monday?.capacity).toBe(120);
	});

	it('allocates nothing on rest weekdays', () => {
		const result = buildSchedule({
			startDate: MONDAY,
			days: 7,
			weekdayMinutes: 120,
			weekendMinutes: 300,
			restWeekdays: [7],
			pending: chapters('Mathematics', 5),
		});

		expect(result.entries.some((entry) => entry.date === SUNDAY)).toBe(false);
		expect(result.dailyTotals.find((day) => day.date === SUNDAY)?.minutes).toBe(0);
	});

	it('rotates fairly across subjects instead of draining one subject first', () => {
		const result = buildSchedule({
			startDate: MONDAY,
			days: 10,
			weekdayMinutes: 120,
			weekendMinutes: 120,
			restWeekdays: [],
			pending: [...chapters('Mathematics', 3), ...chapters('Physics', 3)],
		});

		const firstDay = result.entries.filter((entry) => entry.date === MONDAY);
		expect(firstDay.map((entry) => entry.subject)).toEqual(['Mathematics', 'Physics']);
		const secondDay = result.entries.filter((entry) => entry.date === '2026-10-20');
		expect(secondDay.map((entry) => entry.subject)).toEqual(['Mathematics', 'Physics']);
	});

	it('keeps each chapter whole rather than splitting it across days', () => {
		const result = buildSchedule({
			startDate: MONDAY,
			days: 5,
			weekdayMinutes: 90,
			weekendMinutes: 90,
			restWeekdays: [],
			pending: chapters('Mathematics', 3, 60),
		});

		expect(result.entries.every((entry) => entry.minutes === 60)).toBe(true);
		const perDay = new Map<string, number>();
		for (const entry of result.entries) perDay.set(entry.date, (perDay.get(entry.date) ?? 0) + 1);
		expect([...perDay.values()]).toEqual([1, 1, 1]);
	});

	it('is deterministic for identical input', () => {
		const request = {
			startDate: MONDAY,
			days: 21,
			weekdayMinutes: 150,
			weekendMinutes: 300,
			restWeekdays: [7],
			pending: [...chapters('Mathematics', 5), ...chapters('Physics', 4), ...chapters('Commerce', 6)],
		};
		expect(buildSchedule(request)).toEqual(buildSchedule(request));
	});

	it('reports chapters that do not fit inside the horizon as unscheduled', () => {
		const result = buildSchedule({
			startDate: MONDAY,
			days: 2,
			weekdayMinutes: 60,
			weekendMinutes: 60,
			restWeekdays: [],
			pending: chapters('Mathematics', 5),
		});

		expect(result.entries).toHaveLength(2);
		expect(result.unscheduled.map((chapter) => chapter.sequence)).toEqual([3, 4, 5]);
	});

	it('completes the same course sooner when the parent raises the daily hours', () => {
		const pending = chapters('Mathematics', 10, 60);
		const light = buildSchedule({
			startDate: MONDAY,
			days: 30,
			weekdayMinutes: 60,
			weekendMinutes: 60,
			restWeekdays: [],
			pending,
		});
		const heavy = buildSchedule({
			startDate: MONDAY,
			days: 30,
			weekdayMinutes: 180,
			weekendMinutes: 180,
			restWeekdays: [],
			pending,
		});

		const lightFinish = light.entries.at(-1)?.date as string;
		const heavyFinish = heavy.entries.at(-1)?.date as string;
		expect(heavyFinish < lightFinish).toBe(true);
		expect(heavy.entries).toHaveLength(10);
		expect(light.entries).toHaveLength(10);
	});

	it('rolls unfinished work forward when a new plan starts later', () => {
		const pending = chapters('Mathematics', 4, 60);
		const first = buildSchedule({
			startDate: MONDAY,
			days: 2,
			weekdayMinutes: 60,
			weekendMinutes: 60,
			restWeekdays: [],
			pending,
		});
		const carried = first.unscheduled;
		const second = buildSchedule({
			startDate: '2026-10-21',
			days: 5,
			weekdayMinutes: 60,
			weekendMinutes: 60,
			restWeekdays: [],
			pending: carried,
		});

		expect(second.entries.map((entry) => entry.sequence)).toEqual([3, 4]);
		expect(second.entries[0].date).toBe('2026-10-21');
	});

	it('honours a reduced capacity for a specific date', () => {
		const result = buildSchedule({
			startDate: MONDAY,
			days: 3,
			weekdayMinutes: 120,
			weekendMinutes: 300,
			restWeekdays: [],
			pending: chapters('Mathematics', 5, 60),
			capacityOverrides: { [MONDAY]: 60 },
		});

		expect(result.dailyTotals.find((day) => day.date === MONDAY)?.minutes).toBe(60);
		expect(result.entries.filter((entry) => entry.date === MONDAY)).toHaveLength(1);
	});

	it('schedules a longer chapter when it is the only work left', () => {
		const result = buildSchedule({
			startDate: MONDAY,
			days: 3,
			weekdayMinutes: 120,
			weekendMinutes: 120,
			restWeekdays: [],
			pending: chapters('Mathematics', 1, 75),
		});

		expect(result.entries).toEqual([
			{
				date: MONDAY,
				subject: 'Mathematics',
				sequence: 1,
				templateId: 'template-mathematics-1',
				minutes: 75,
				position: 0,
			},
		]);
	});
});
