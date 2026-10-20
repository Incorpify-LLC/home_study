-- Link parent accounts to the students they are permitted to manage.

CREATE TABLE parent_students (
  parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES student_profiles(user_id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (parent_id, student_id)
);

CREATE INDEX parent_students_student
  ON parent_students (student_id, parent_id);
