# Contributing

## Branches and commits

- Create a short-lived branch from `main`: `feat/...`, `fix/...`, `docs/...`, or `ci/...`.
- Use conventional commits.
- Keep each pull request to one deployable behavior slice.
- Never commit family data, rough-work images, credentials, or production exports.

## Definition of done

A story is done only when:

- Its acceptance behavior was written as a failing test first.
- The failure was observed for the expected reason.
- The smallest implementation passed that test.
- The full `npm run check` gate passes.
- Security and authorization boundaries were reviewed.
- Documentation or migrations changed where the behavior requires them.
- The deployed behavior has a verifiable smoke check.
- Feedback can be collected without pretending unfinished features work.

## Database changes

- Add a new numbered migration; never rewrite a migration applied remotely.
- Test migration behavior locally before remote application.
- Prefer additive schema changes in early agile iterations.
- Destructive changes require a backup/rollback plan and explicit review.

## Content fixtures

Use anonymous personas such as `student-a`; do not use real family names, ages, weaknesses, email addresses, or school documents in tests.
