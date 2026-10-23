-- Individual Hero Path rewards. XP is append-only, idempotent, and never negative.

PRAGMA foreign_keys = ON;

CREATE TABLE hero_xp_events (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('daily_plan', 'corrections', 'on_schedule', 'weekly_streak', 'recovery')),
  points INTEGER NOT NULL CHECK (points > 0),
  assignment_id TEXT REFERENCES assignments(id) ON DELETE SET NULL,
  plan_entry_id TEXT REFERENCES study_plan_entries(id) ON DELETE SET NULL,
  event_date TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX hero_xp_events_student_date
  ON hero_xp_events (student_id, event_date, created_at);

CREATE TABLE hero_day_status (
  student_id TEXT NOT NULL REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status = 'excused'),
  reason TEXT NOT NULL CHECK (reason IN ('school_exam', 'illness', 'travel', 'rest', 'other')),
  note TEXT,
  marked_by TEXT NOT NULL REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, date)
);

CREATE TABLE hero_recovery_quests (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES assignment_templates(id),
  plan_entry_id TEXT REFERENCES study_plan_entries(id) ON DELETE SET NULL,
  scheduled_for TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'excused')),
  opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  UNIQUE (student_id, template_id)
);

CREATE INDEX hero_recovery_quests_student_status
  ON hero_recovery_quests (student_id, status, scheduled_for);

CREATE TABLE hero_rewards (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  xp_required INTEGER NOT NULL CHECK (xp_required BETWEEN 0 AND 100000),
  created_by TEXT NOT NULL REFERENCES users(id),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX hero_rewards_student_active
  ON hero_rewards (student_id, active, xp_required);
