-- Evaluation demo identity: one student account that can act as a learner in any
-- class and be reset between demonstrations.

ALTER TABLE users ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1));

INSERT INTO users (id, role, display_name, email, is_demo, active)
VALUES ('demo-student', 'student', 'Demo Learner', 'private-address@example.test', 1, 1);

INSERT INTO student_profiles (user_id, board, class_level, exam_year)
VALUES ('demo-student', 'CISCE', 'X', 2027);

INSERT INTO study_settings (student_id, weekday_minutes, weekend_minutes, rest_weekdays, horizon_days)
VALUES ('demo-student', 120, 120, '[]', 14);
