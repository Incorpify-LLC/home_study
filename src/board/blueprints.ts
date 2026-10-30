// Board paper blueprints derived from official CISCE specimen papers.
// Structure only — question text is never copied; see docs/BOARD_FORMAT_PARITY.md.

export type BoardSection = {
	id: string;
	label: string;
	compulsory: boolean;
	attemptAny: number | null;
	marks: number;
};

export type BoardPaperBlueprint = {
	board: 'ICSE' | 'ISC';
	subject: string;
	paperId: string;
	examYear: number;
	maximumMarks: number;
	durationMinutes: number;
	readingMinutes: number;
	sections: BoardSection[];
	/** Marks by archetype across a fully-attempted paper (choice-inclusive). */
	archetypeMarks: Record<string, number>;
	structureNote: string;
	sources: Array<{ url: string; retrievedAt: string; sha256: string }>;
};

export const ICSE_PHYSICS_2026: BoardPaperBlueprint = {
	board: 'ICSE',
	subject: 'Physics',
	paperId: 'T26 521 (Science Paper 1)',
	examYear: 2026,
	maximumMarks: 80,
	durationMinutes: 120,
	readingMinutes: 15,
	sections: [
		{ id: 'A', label: 'Section A — objective + short structured', compulsory: true, attemptAny: null, marks: 40 },
		{ id: 'B', label: 'Section B — attempt any 4 of 6 structured questions', compulsory: false, attemptAny: 4, marks: 40 },
	],
	archetypeMarks: {
		single_choice: 14,
		assertion_reason: 1,
		fill_blank: 6,
		matching: 2,
		short_structured: 10,
		numerical: 26,
		diagram_based: 8,
		true_false_justify: 4,
		define_state: 4,
		give_reason: 5,
	},
	structureNote:
		'Section A: Q1 = 15×1m MCQ (one assertion–reason), Q2 = 6×1m fill-blank + 2m matching + 2m name+reason, Q3 = 7×2m short structured (numericals, true/false+justify, diagram reading). Section B: 6 questions of 10m each (3+3+4 multi-part); attempt any four.',
	sources: [
		{
			url: 'https://cisce.org/wp-content/uploads/2025/07/ICSE-2026-SPECIMEN-521-SCI1.pdf',
			retrievedAt: '2026-10-30',
			sha256: 'pending-official-fetch',
		},
	],
};

export const ISC_PHYSICS_2026: BoardPaperBlueprint = {
	board: 'ISC',
	subject: 'Physics',
	paperId: '861A Paper 1 (Theory)',
	examYear: 2026,
	maximumMarks: 70,
	durationMinutes: 180,
	readingMinutes: 15,
	sections: [
		{ id: 'A', label: 'Section A — 14×1m (7 MCQ + 7 brief)', compulsory: true, attemptAny: null, marks: 14 },
		{ id: 'B', label: 'Section B — 7×2m (internal choice in 2)', compulsory: true, attemptAny: null, marks: 14 },
		{ id: 'C', label: 'Section C — 9×3m (internal choice in 2)', compulsory: true, attemptAny: null, marks: 27 },
		{ id: 'D', label: 'Section D — 3×5m (internal choice in 2)', compulsory: true, attemptAny: null, marks: 15 },
	],
	archetypeMarks: {
		single_choice: 6,
		assertion_reason: 1,
		short_structured: 7,
		numerical: 25,
		derivation: 6,
		diagram_based: 3,
		define_state: 3,
		give_reason: 3,
		experiment_based: 16,
	},
	structureNote:
		'Section A: 7×1m MCQ (one assertion–reason) + 7×1m brief answers. Section B: 7×2m. Section C: 9×3m with internal choice in two questions. Section D: 3×5m with internal choice in two questions; derivations and multi-step numericals.',
	sources: [
		{
			url: 'https://cisce.org/wp-content/uploads/2025/08/861A-PHYSICS-PAPER-1-SQP-AK.pdf',
			retrievedAt: '2026-10-30',
			sha256: '01705501cc8b67f4d6d510620a3e8da201e4bf7a3eef582db35d9393c76a1b3a',
		},
	],
};

export const BOARD_BLUEPRINTS: BoardPaperBlueprint[] = [ICSE_PHYSICS_2026, ISC_PHYSICS_2026];
