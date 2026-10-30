import type { BoardPaperBlueprint } from './blueprints';
import { ICSE_PHYSICS_2026 } from './blueprints';

/** Archetype of a banked question, derived from its declared type. */
export type BankArchetype = 'single_choice' | 'multiple_select' | 'numeric' | 'matching' | 'ordering';

export type ParityCoverageRow = {
	archetype: string;
	required: number;
	available: number;
};

export type ParityReport = {
	board: string;
	topicId: string;
	blueprint: BoardPaperBlueprint;
	coverage: Record<string, ParityCoverageRow>;
	shortfallArchetypes: string[];
	percentage: number;
};

type BoardEnv = Pick<Env, 'DB'>;

/**
 * Chapter-level board-format parity: how far a topic's reviewed question bank
 * covers the official blueprint's archetype mix. A report, never a claim —
 * gaps are listed explicitly.
 */
export async function parityForTopic(env: BoardEnv, topicId: string): Promise<ParityReport> {
	const blueprint = ICSE_PHYSICS_2026;

	const rows = await env.DB.prepare(
		`SELECT questions.question_type AS type, COUNT(*) AS count
		   FROM questions
		  WHERE questions.topic_id = ?
		    AND questions.review_status = 'reviewed'
		  GROUP BY questions.question_type`,
	)
		.bind(topicId)
		.all<{ type: BankArchetype; count: number }>();

	const available: Record<string, number> = {};
	for (const row of rows.results) available[row.type] = row.count;

	const coverage: Record<string, ParityCoverageRow> = {};
	const allArchetypes = new Set([...Object.keys(blueprint.archetypeMarks), ...Object.keys(available)]);
	for (const archetype of allArchetypes) {
		coverage[archetype] = {
			archetype,
			required: blueprint.archetypeMarks[archetype] ?? 0,
			available: available[archetype] ?? 0,
		};
	}

	const shortfallArchetypes = Object.values(coverage)
		.filter((row) => row.available === 0 && row.required > 0)
		.map((row) => row.archetype);

	const requiredMarks = Object.values(blueprint.archetypeMarks).reduce((sum, marks) => sum + marks, 0);
	const coveredMarks = Object.entries(blueprint.archetypeMarks).reduce((sum, [archetype, marks]) => {
		const have = available[archetype] ?? 0;
		// Partial credit for coverage: an archetype with at least one reviewed
		// item counts proportionally to how many items exist (1 item ≈ one
		// board question of that archetype).
		return sum + (have > 0 ? marks * Math.min(1, have / 3) : 0);
	}, 0);

	return {
		board: blueprint.board,
		topicId,
		blueprint,
		coverage,
		shortfallArchetypes,
		percentage: requiredMarks === 0 ? 0 : Math.round((coveredMarks / requiredMarks) * 100),
	};
}
