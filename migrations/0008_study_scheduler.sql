-- Study scheduler: parent-set study hours, generated assessment calendars, and
-- the entries that bind a chapter to a specific day.

CREATE TABLE study_settings (
  student_id TEXT PRIMARY KEY REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  weekday_minutes INTEGER NOT NULL DEFAULT 120 CHECK (weekday_minutes BETWEEN 30 AND 480),
  weekend_minutes INTEGER NOT NULL DEFAULT 300 CHECK (weekend_minutes BETWEEN 30 AND 480),
  rest_weekdays TEXT NOT NULL DEFAULT '[7]',
  horizon_days INTEGER NOT NULL DEFAULT 28 CHECK (horizon_days BETWEEN 7 AND 90),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT REFERENCES users(id)
);

CREATE TABLE study_plans (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  weekday_minutes INTEGER NOT NULL CHECK (weekday_minutes > 0),
  weekend_minutes INTEGER NOT NULL CHECK (weekend_minutes > 0),
  rest_weekdays TEXT NOT NULL,
  change_reason TEXT NOT NULL
    CHECK (change_reason IN ('initial', 'hours_changed', 'course_changed', 'roll_forward', 'manual')),
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE UNIQUE INDEX study_plans_student_active
  ON study_plans (student_id)
  WHERE active = 1;

CREATE TABLE study_plan_entries (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  scheduled_for TEXT NOT NULL,
  subject TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence >= 1),
  template_id TEXT NOT NULL REFERENCES assignment_templates(id),
  allocated_minutes INTEGER NOT NULL CHECK (allocated_minutes > 0),
  position INTEGER NOT NULL CHECK (position >= 0),
  state TEXT NOT NULL DEFAULT 'planned' CHECK (state IN ('planned', 'done', 'missed')),
  completed_at TEXT,
  UNIQUE (plan_id, template_id),
  UNIQUE (plan_id, scheduled_for, position)
);

CREATE INDEX study_plan_entries_student_date
  ON study_plan_entries (student_id, scheduled_for);
