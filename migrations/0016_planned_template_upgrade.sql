-- Upgrade untouched planned work to the active template for the plan's
-- curriculum class. The class is derived from the plan, not the learner's
-- current profile, because class/demo switching can leave historical plans.

PRAGMA foreign_keys = ON;

UPDATE study_plan_entries
SET template_id = (SELECT current_template.id
       FROM assignment_templates AS current_template
       WHERE current_template.class_level = (SELECT peer_template.class_level
         FROM study_plan_entries AS peer
         JOIN assignment_templates AS peer_template ON peer_template.id = peer.template_id
         WHERE peer.plan_id = study_plan_entries.plan_id
         GROUP BY peer_template.class_level
         ORDER BY COUNT(*) DESC, peer_template.class_level
         LIMIT 1)
         AND current_template.subject = study_plan_entries.subject
         AND current_template.sequence = study_plan_entries.sequence
         AND current_template.active = 1
         AND current_template.review_status = 'reviewed'
       LIMIT 1)
WHERE study_plan_entries.state = 'planned'
  AND NOT EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.student_id = study_plan_entries.student_id
        AND assignments.template_id = study_plan_entries.template_id
    )
  AND EXISTS (
      SELECT 1
      FROM assignment_templates AS current_template
      WHERE current_template.class_level = (SELECT peer_template.class_level
         FROM study_plan_entries AS peer
         JOIN assignment_templates AS peer_template ON peer_template.id = peer.template_id
         WHERE peer.plan_id = study_plan_entries.plan_id
         GROUP BY peer_template.class_level
         ORDER BY COUNT(*) DESC, peer_template.class_level
         LIMIT 1)
        AND current_template.subject = study_plan_entries.subject
        AND current_template.sequence = study_plan_entries.sequence
        AND current_template.active = 1
        AND current_template.review_status = 'reviewed'
        AND current_template.id <> study_plan_entries.template_id
    );
