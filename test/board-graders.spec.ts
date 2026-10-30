import { describe, expect, it } from 'vitest';

import { scoreNumeric, scoreMultipleSelect, scoreMatching, normalizeUnit } from '../src/board/grade';

describe('numeric grader with units', () => {
	it('accepts a value within absolute tolerance and awards full credit', () => {
		const score = scoreNumeric({ value: 3, tolerance: 0.05, unit: 'N m' }, { value: 3.03, unit: 'N m' });
		expect(score).toBe(1);
	});

	it('rejects a value outside tolerance', () => {
		const score = scoreNumeric({ value: 3, tolerance: 0.05, unit: 'N m' }, { value: 3.2, unit: 'N m' });
		expect(score).toBe(0);
	});

	it('supports relative tolerance for large values', () => {
		const score = scoreNumeric({ value: 5000, relativeTolerance: 0.02 }, { value: 5090 });
		expect(score).toBe(1);
	});

	it('accepts equivalent unit spellings after normalization', () => {
		expect(normalizeUnit('N·m')).toBe(normalizeUnit('N m'));
		expect(normalizeUnit('newton metre')).toBe('newton metre');
		const score = scoreNumeric({ value: 3, tolerance: 0.05, unit: 'N·m' }, { value: 3, unit: 'N m' });
		expect(score).toBe(1);
	});

	it('awards half credit for a correct value with a wrong unit when a unit is expected', () => {
		const score = scoreNumeric({ value: 3, tolerance: 0.05, unit: 'N m' }, { value: 3, unit: 'J' });
		expect(score).toBe(0.5);
	});

	it('accepts any unit from the accepted set', () => {
		const score = scoreNumeric({ value: 12, tolerance: 0.1, acceptedUnits: ['kWh', 'kW h'] }, { value: 12, unit: 'kW h' });
		expect(score).toBe(1);
	});

	it('scores legacy answers without units at full value credit', () => {
		const score = scoreNumeric({ value: 36, tolerance: 0.5 }, { value: 36.2 });
		expect(score).toBe(1);
	});
});

describe('multiple-select grader', () => {
	it('awards full credit for the exact set', () => {
		const score = scoreMultipleSelect({ choices: ['a', 'c', 'd'] }, { choices: ['d', 'a', 'c'] });
		expect(score).toBe(1);
	});

	it('awards proportional credit minus wrong picks', () => {
		const score = scoreMultipleSelect({ choices: ['a', 'c', 'd'] }, { choices: ['a', 'c', 'b'] });
		expect(score).toBeCloseTo(1 / 3);
	});

	it('never goes below zero', () => {
		const score = scoreMultipleSelect({ choices: ['a'] }, { choices: ['b', 'c', 'd'] });
		expect(score).toBe(0);
	});
});

describe('matching grader', () => {
	it('awards credit per correct pair', () => {
		const score = scoreMatching({ pairs: { a: 'x', b: 'y', c: 'z' } }, { pairs: { a: 'x', b: 'w', c: 'z' } });
		expect(score).toBeCloseTo(2 / 3);
	});

	it('awards full credit when every pair matches', () => {
		const score = scoreMatching({ pairs: { a: 'x', b: 'y' } }, { pairs: { b: 'y', a: 'x' } });
		expect(score).toBe(1);
	});
});
