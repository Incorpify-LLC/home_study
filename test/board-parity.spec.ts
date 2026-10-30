import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { BOARD_BLUEPRINTS, ICSE_PHYSICS_2026, ISC_PHYSICS_2026, type BoardPaperBlueprint } from '../src/board/blueprints';
import { validateBlueprint } from '../src/board/validate';
import { parityForTopic } from '../src/board/parity';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

function blueprintById(id: string): BoardPaperBlueprint {
	const found = BOARD_BLUEPRINTS.find((blueprint) => blueprint.paperId === id);
	if (!found) throw new Error(`missing blueprint ${id}`);
	return found;
}

describe('board blueprint integrity', () => {
	it('keeps every blueprint internally consistent', () => {
		for (const blueprint of BOARD_BLUEPRINTS) {
			const report = validateBlueprint(blueprint);
			expect(report.errors, `${blueprint.paperId}: ${report.errors.join('; ')}`).toEqual([]);
		}
	});

	it('matches the official ICSE 2026 Physics specimen structure', () => {
		expect(blueprintById('T26 521 (Science Paper 1)').maximumMarks).toBe(80);
		expect(ICSE_PHYSICS_2026.sections[0].marks).toBe(40);
		expect(ICSE_PHYSICS_2026.sections[1].marks).toBe(40);
		expect(ICSE_PHYSICS_2026.sections[1].attemptAny).toBe(4);
		expect(ICSE_PHYSICS_2026.archetypeMarks.single_choice).toBe(14);
		expect(ICSE_PHYSICS_2026.archetypeMarks.assertion_reason).toBe(1);
		expect(ICSE_PHYSICS_2026.archetypeMarks.fill_blank).toBe(6);
		expect(ICSE_PHYSICS_2026.archetypeMarks.matching).toBe(2);
	});

	it('matches the official ISC 2026 Physics specimen structure', () => {
		expect(ISC_PHYSICS_2026.maximumMarks).toBe(70);
		expect(ISC_PHYSICS_2026.sections.map((section) => section.marks)).toEqual([14, 14, 27, 15]);
		expect(ISC_PHYSICS_2026.archetypeMarks.single_choice).toBe(6);
		expect(ISC_PHYSICS_2026.archetypeMarks.assertion_reason).toBe(1);
	});
});

describe('blueprint validator catches structural errors', () => {
	it('flags section marks that do not total the maximum', () => {
		const report = validateBlueprint({
			...ICSE_PHYSICS_2026,
			sections: ICSE_PHYSICS_2026.sections.map((section, index) => (index === 0 ? { ...section, marks: 41 } : section)),
		});
		expect(report.errors.some((error) => error.includes('sections total'))).toBe(true);
	});

	it('flags archetype marks that do not total the maximum', () => {
		const report = validateBlueprint({
			...ICSE_PHYSICS_2026,
			archetypeMarks: { ...ICSE_PHYSICS_2026.archetypeMarks, single_choice: 16 },
		});
		expect(report.errors.some((error) => error.includes('archetype marks total'))).toBe(true);
	});

	it('flags a choice section worth more than it can absorb', () => {
		const report = validateBlueprint({
			...ICSE_PHYSICS_2026,
			sections: [{ ...ICSE_PHYSICS_2026.sections[0] }, { id: 'B', label: 'B', compulsory: false, attemptAny: 4, marks: 45 }],
		});
		expect(report.errors.length).toBeGreaterThan(0);
	});
});

describe('chapter parity report', () => {
	it('shows the current Force bank against the ICSE blueprint', async () => {
		const report = await parityForTopic(env, 'topic-x-physics-turning-forces');
		expect(report.board).toBe('ICSE');
		expect(report.blueprint.paperId).toBe('T26 521 (Science Paper 1)');
		expect(report.coverage.single_choice.required).toBe(14);
		expect(report.coverage.numerical.required).toBe(26);
		// Today the bank only has single_choice and numeric questions.
		expect(report.coverage.assertion_reason.available).toBe(0);
		expect(report.coverage.matching.available).toBe(0);
		expect(report.coverage.fill_blank.available).toBe(0);
		expect(report.shortfallArchetypes.length).toBeGreaterThan(0);
		expect(report.percentage).toBeLessThan(100);
	});
});
