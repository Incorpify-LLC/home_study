export type NumericAnswer = {
	value: number;
	unit?: string;
};

export type NumericMarkScheme = {
	value: number;
	tolerance?: number;
	relativeTolerance?: number;
	unit?: string;
	acceptedUnits?: string[];
};

/** Normalize a unit string: collapse separators so equivalent spellings compare equal. */
export function normalizeUnit(unit: string): string {
	return unit
		.trim()
		.toLowerCase()
		.replace(/[·\u00b7.\s]+/g, ' ');
}

/**
 * Tier-1 numeric grader: value within tolerance earns full credit; a correct
 * value with a wrong unit earns half credit (value mark), never more.
 */
export function scoreNumeric(expected: NumericMarkScheme, actual: { value?: number; unit?: string }): number {
	const actualValue = typeof actual?.value === 'number' ? actual.value : undefined;
	if (actualValue === undefined || !Number.isFinite(actualValue)) return 0;

	const absolute = typeof expected.tolerance === 'number' ? expected.tolerance : 0;
	const relative = typeof expected.relativeTolerance === 'number' ? expected.relativeTolerance : 0;
	const tolerance = Math.max(absolute, Math.abs(expected.value) * relative);
	if (Math.abs(expected.value - actualValue) > tolerance) return 0;

	const expectedUnits: string[] = [];
	if (typeof expected.unit === 'string') expectedUnits.push(normalizeUnit(expected.unit));
	for (const unit of expected.acceptedUnits ?? []) {
		if (typeof unit === 'string') expectedUnits.push(normalizeUnit(unit));
	}
	if (expectedUnits.length === 0) return 1; // legacy scheme: value-only question

	const actualUnit = typeof actual?.unit === 'string' ? actual.unit : undefined;
	if (actualUnit === undefined) return 0.5; // correct value, unit not attempted
	return expectedUnits.includes(normalizeUnit(actualUnit)) ? 1 : 0.5;
}

type ChoiceAnswer = { choices: unknown };

/** Multiple-select: proportional credit, penalised for wrong picks, floor 0. */
export function scoreMultipleSelect(expected: ChoiceAnswer, actual: ChoiceAnswer): number {
	const expectedSet = new Set(Array.isArray(expected.choices) ? expected.choices.map(String) : []);
	const actualList = Array.isArray(actual.choices) ? actual.choices.map(String) : [];
	if (expectedSet.size === 0) return 0;
	let correct = 0;
	for (const choice of actualList) if (expectedSet.has(choice)) correct += 1;
	const wrong = actualList.length - correct;
	const raw = (correct - wrong) / expectedSet.size;
	return Math.max(0, Math.min(1, raw));
}

type MatchAnswer = { pairs: unknown };

/** Matching: credit per correctly matched pair. */
export function scoreMatching(expected: MatchAnswer, actual: MatchAnswer): number {
	const expectedPairs = isPairMap(expected.pairs) ? expected.pairs : {};
	const actualPairs = isPairMap(actual.pairs) ? actual.pairs : {};
	const keys = Object.keys(expectedPairs);
	if (keys.length === 0) return 0;
	let correct = 0;
	for (const key of keys) if (actualPairs[key] === expectedPairs[key]) correct += 1;
	return correct / keys.length;
}

function isPairMap(value: unknown): value is Record<string, string> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
	return Object.values(value).every((entry) => typeof entry === 'string');
}
