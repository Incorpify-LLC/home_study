-- Public fixtures use a reserved example.test address; production identity data is provisioned separately.
UPDATE users
SET email = 'demo-student@example.test'
WHERE id = 'demo-student';
