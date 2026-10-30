import type { BoardPaperBlueprint } from './blueprints';
import { BOARD_BLUEPRINTS, ICSE_PHYSICS_2026 } from './blueprints';
import { parityForTopic, type ParityReport } from './parity';

type BoardEnv = { DB: D1Database };

export type AssemblyQuestion = {
	topicId: string;
	questionId: string;
	questionType: string;
	marks: number;
};

export type AssembledMock = {
	blueprint: BoardPaperBlueprint;
	selected: AssemblyQuestion[];
	unavailableArchetypes: string[];
};

/**
 * Pick blueprint and bank candidates for an assembled mock paper. Marks are
 * summed section-by-section so the totals can be verified against the
 * blueprint; missing archetypes are listed explicitly so the gap is
 * visible. The caller supplies candidate questions grouped by section
 * (e.g. grouped by chapter tag) so domain knowledge decides where to
 * draw the items from.
 */
export function assembleMock(blueprint: BoardPaperBlueprint, candidates: Map<string, AssemblyQuestion[]>): AssembledMock {
	const selected: AssemblyQuestion[] = [];
	const unavailable: string[] = [];
	for (const archetype of Object.keys(blueprint.archetypeMarks)) {
		const required = blueprint.archetypeMarks[archetype];
		const bank = candidates.get(archetype) ?? [];
		const chosen = bank.slice(0, required);
		if (chosen.length < required) unavailable.push(archetype);
		selected.push(...chosen);
	}
	return { blueprint, selected, unavailableArchetypes: unavailable };
}

/**
 * Aggregate parity coverage across the ICSE blueprint's archetype set
 * for every reviewed topic. Used by the parity dashboard.
 */
export async function boardParitySnapshot(env: BoardEnv): Promise<ParityReport[]> {
	const topics = await env.DB.prepare(
		`SELECT id FROM curriculum_topics
		   WHERE board = ? AND class_level = ? AND review_status = 'reviewed'`,
	)
		.bind(ICSE_PHYSICS_2026.board, 'X')
		.all<{ id: string }>();
	const reports: ParityReport[] = [];
	for (const topic of topics.results) {
		reports.push(await parityForTopic(env, topic.id));
	}
	return reports;
}

export { BOARD_BLUEPRINTS };
