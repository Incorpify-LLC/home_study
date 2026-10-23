import process from 'node:process';
import { writeFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';

const dominantClass = `(SELECT peer_template.class_level
         FROM study_plan_entries AS peer
         JOIN assignment_templates AS peer_template ON peer_template.id = peer.template_id
         WHERE peer.plan_id = study_plan_entries.plan_id
         GROUP BY peer_template.class_level
         ORDER BY COUNT(*) DESC, peer_template.class_level
         LIMIT 1)`;

const replacement = `(SELECT current_template.id
       FROM assignment_templates AS current_template
       WHERE current_template.class_level = ${dominantClass}
         AND current_template.subject = study_plan_entries.subject
         AND current_template.sequence = study_plan_entries.sequence
         AND current_template.active = 1
         AND current_template.review_status = 'reviewed'
       LIMIT 1)`;

const output = `-- Upgrade untouched planned work to the active template for the plan's
-- curriculum class. The class is derived from the plan, not the learner's
-- current profile, because class/demo switching can leave historical plans.

PRAGMA foreign_keys = ON;

UPDATE study_plan_entries
SET template_id = ${replacement}
WHERE study_plan_entries.state = 'planned'
  AND NOT EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.student_id = study_plan_entries.student_id
        AND assignments.template_id = study_plan_entries.template_id
    )
  AND EXISTS (
      SELECT 1
      FROM assignment_templates AS current_template
      WHERE current_template.class_level = ${dominantClass}
        AND current_template.subject = study_plan_entries.subject
        AND current_template.sequence = study_plan_entries.sequence
        AND current_template.active = 1
        AND current_template.review_status = 'reviewed'
        AND current_template.id <> study_plan_entries.template_id
    );
`;

const target = new NodeURL('../migrations/0016_planned_template_upgrade.sql', import.meta.url);
writeFileSync(target, output);
process.stdout.write('Generated 0016_planned_template_upgrade.sql.\n');
