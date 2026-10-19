-- Family sign-in names are independent of email addresses.

ALTER TABLE users ADD COLUMN login_identifier TEXT;

CREATE UNIQUE INDEX users_login_identifier_unique
  ON users (lower(login_identifier))
  WHERE login_identifier IS NOT NULL;