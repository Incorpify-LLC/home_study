-- The evaluation demo identity signs in from the private-address@example.test mailbox.
UPDATE users
SET email = 'private-address@example.test'
WHERE id = 'demo-student';
