import type { BoardPaperBlueprint } from './blueprints';

export type BlueprintValidationReport = {
	errors: string[];
	warnings: string[];
};

/**
 * Structural validation of a board blueprint. Parity must be provable:
 * section marks, archetype marks, and choice arithmetic all have to close.
 */
export function validateBlueprint(blueprint: BoardPaperBlueprint): BlueprintValidationReport {
	const errors: string[] = [];
	const warnings: string[] = [];

	const sectionTotal = blueprint.sections.reduce((sum, section) => sum + section.marks, 0);
	if (sectionTotal !== blueprint.maximumMarks) {
		errors.push(`sections total ${sectionTotal} but maximum marks are ${blueprint.maximumMarks}`);
	}

	const archetypeTotal = Object.values(blueprint.archetypeMarks).reduce((sum, marks) => sum + marks, 0);
	if (archetypeTotal !== blueprint.maximumMarks) {
		errors.push(`archetype marks total ${archetypeTotal} but maximum marks are ${blueprint.maximumMarks}`);
	}

	for (const section of blueprint.sections) {
		if (!section.compulsory) {
			if (section.attemptAny === null || section.attemptAny < 1) {
				errors.push(`optional section ${section.id} must declare how many questions to attempt`);
			}
		} else if (section.attemptAny !== null) {
			warnings.push(`compulsory section ${section.id} declares attemptAny; it should be null`);
		}
	}

	if (blueprint.durationMinutes <= 0) errors.push('duration must be positive');
	if (blueprint.sources.length === 0) errors.push('at least one official source is required');
	for (const source of blueprint.sources) {
		if (!/^https:\/\/cisce\.org\//.test(source.url)) warnings.push(`source ${source.url} is not a cisce.org URL`);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(source.retrievedAt)) errors.push(`source ${source.url} needs a retrieval date`);
	}

	return { errors, warnings };
}
