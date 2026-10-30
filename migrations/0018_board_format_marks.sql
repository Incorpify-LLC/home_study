-- Issue #7 board-format parity: mark metadata for existing questions.
-- Additive only: every existing question keeps one mark, so all current
-- scores, percentages, and mastery ratios are unchanged.

ALTER TABLE questions ADD COLUMN marks INTEGER NOT NULL DEFAULT 1 CHECK (marks BETWEEN 1 AND 5);
