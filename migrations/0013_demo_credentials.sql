-- Credential sign-in for the evaluation demo identities only.
--
-- The family stays behind Cloudflare Access email OTP. This adds a second,
-- narrower door that exists purely so the demo learner and demo parent can be
-- driven by an automated browser check: it is issued to `is_demo = 1` accounts
-- alone, it needs a one-time enrolment code before a password exists, and the
-- session cookie it hands out is ignored for every other identity.

CREATE TABLE login_attempts (
  scope TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0 CHECK (failures >= 0),
  window_started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE demo_enrolment (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at TEXT
);

UPDATE users SET login_identifier = 'demo-student' WHERE id = 'demo-student';

INSERT INTO users (id, role, display_name, is_demo, active, login_identifier)
VALUES ('demo-parent', 'parent', 'Demo Parent', 1, 1, 'demo-parent');

INSERT OR IGNORE INTO parent_students (parent_id, student_id)
VALUES ('demo-parent', 'demo-student');
