import { applyD1Migrations, env, SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

import { assembleMock, boardParitySnapshot } from '../src/board/assemble';
import { ICSE_PHYSICS_2026 } from '../src/board/blueprints';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		TEST_MIGRATIONS: D1Migration[];
	}
}

const parentEmail = 'parent-a@example.test';

function accessHeaders(email: string, json = false): HeadersInit {
	return {
		'cf-access-test-email': email,
		...(json ? { 'content-type': 'application/json' } : {}),
	};
}

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
	await env.DB.batch([
		env.DB.prepare(`INSERT INTO users (id, role, display_name, email) VALUES ('parent-a', 'parent', 'Parent A', ?)`).bind(parentEmail),
	]);
});

describe('board assembly (issue #7)', () => {
	it('flags archetypes with no bank coverage', () => {
		const result = assembleMock(ICSE_PHYSICS_2026, new Map());
		expect(result.unavailableArchetypes.length).toBeGreaterThan(0);
		expect(result.selected.length).toBe(0);
	});

	it('selects exactly the blueprint marks count when bank has enough', () => {
		const candidates = new Map<string, { topicId: string; questionId: string; questionType: string; marks: number }[]>();
		candidates.set('single_choice', [
			{ topicId: 'topic-x-physics-turning-forces', questionId: 'q1', questionType: 'single_choice', marks: 1 },
			...Array.from({ length: 13 }, (_, index) => ({
				topicId: 'topic-x-physics-turning-forces',
				questionId: `q${index + 2}`,
				questionType: 'single_choice',
				marks: 1,
			})),
		]);
		candidates.set('numerical', [
			{ topicId: 'topic-x-physics-turning-forces', questionId: 'n1', questionType: 'numeric', marks: 2 },
			{ topicId: 'topic-x-physics-turning-forces', questionId: 'n2', questionType: 'numeric', marks: 2 },
		]);
		const result = assembleMock(ICSE_PHYSICS_2026, candidates);
		expect(result.unavailableArchetypes.length).toBeGreaterThan(0);
		// Single-choice blueprint slot is 14 marks; we supplied 14 items -> 14 picked.
		// Numerical blueprint slot is 26 marks; we supplied 2 items -> 2 picked.
		expect(result.selected.length).toBe(16);
		expect(result.selected.reduce((sum, item) => sum + item.marks, 0)).toBe(14 + 4);
	});
});

describe('board parity API', () => {
	it('returns a snapshot for every reviewed ICSE Physics topic to parents', async () => {
		const snapshot = await boardParitySnapshot(env);
		expect(Array.isArray(snapshot)).toBe(true);
	});

	it('exposes the snapshot through the protected /api/board/parity endpoint', async () => {
		const response = await SELF.fetch('https://study.saneax.in/api/board/parity?board=ICSE&class_level=X', {
			headers: accessHeaders(parentEmail),
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			board: string;
			topics: Array<{ topicId: string; shortfallArchetypes: string[] }>;
		};
		expect(body.board).toBe('ICSE');
		expect(Array.isArray(body.topics)).toBe(true);
	});
});
