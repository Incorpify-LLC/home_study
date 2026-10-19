-- Home Study baseline schema.
-- Migrations are append-only once deployed. Never edit an applied migration.

PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('parent', 'student', 'reviewer')),
  display_name TEXT NOT NULL,
  email TEXT,
  password_hash TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX users_email_unique
  ON users (lower(email))
  WHERE email IS NOT NULL;

CREATE TABLE student_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  board TEXT,
  class_level TEXT NOT NULL,
  exam_year INTEGER,
  weekday_minutes_min INTEGER NOT NULL DEFAULT 120,
  weekday_minutes_max INTEGER NOT NULL DEFAULT 240,
  weekend_minutes_min INTEGER NOT NULL DEFAULT 300,
  weekend_minutes_max INTEGER NOT NULL DEFAULT 360,
  CHECK (weekday_minutes_min <= weekday_minutes_max),
  CHECK (weekend_minutes_min <= weekend_minutes_max)
);

CREATE TABLE curriculum_topics (
  id TEXT PRIMARY KEY,
  board TEXT,
  exam_year INTEGER,
  class_level TEXT NOT NULL,
  subject TEXT NOT NULL,
  unit TEXT NOT NULL,
  topic TEXT NOT NULL,
  learning_objective TEXT NOT NULL,
  source_url TEXT,
  source_retrieved_at TEXT,
  review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'reviewed', 'retired')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES curriculum_topics(id),
  question_type TEXT NOT NULL
    CHECK (question_type IN ('single_choice', 'multiple_select', 'numeric', 'matching', 'ordering')),
  prompt TEXT NOT NULL,
  options_json TEXT,
  answer_json TEXT NOT NULL,
  rationale TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  requires_rough_work INTEGER NOT NULL DEFAULT 0 CHECK (requires_rough_work IN (0, 1)),
  review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'reviewed', 'retired')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assignments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES student_profiles(user_id),
  assigned_for TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'in_progress', 'submitted', 'reviewed', 'skipped')),
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX assignments_student_date
  ON assignments (student_id, assigned_for);

CREATE TABLE assignment_items (
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  position INTEGER NOT NULL CHECK (position >= 0),
  PRIMARY KEY (assignment_id, question_id),
  UNIQUE (assignment_id, position)
);

CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES assignments(id),
  question_id TEXT NOT NULL REFERENCES questions(id),
  answer_json TEXT NOT NULL,
  objective_score REAL,
  final_score REAL,
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
  elapsed_seconds INTEGER CHECK (elapsed_seconds >= 0),
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);

CREATE INDEX attempts_assignment
  ON attempts (assignment_id, submitted_at);

CREATE TABLE uploads (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE mastery_events (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES student_profiles(user_id),
  topic_id TEXT NOT NULL REFERENCES curriculum_topics(id),
  state TEXT NOT NULL
    CHECK (state IN ('not_assessed', 'introduced', 'developing', 'practised', 'secure', 'mastered', 'needs_review')),
  evidence_attempt_id TEXT REFERENCES attempts(id),
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX mastery_student_topic
  ON mastery_events (student_id, topic_id, occurred_at);

CREATE TABLE report_deliveries (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  report_kind TEXT NOT NULL CHECK (report_kind IN ('morning', 'evening', 'weekly')),
  report_period TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  provider_message_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT
);
