# Home Study

A private, adaptive family study platform built on Cloudflare Workers. The product will be developed as short vertical slices: test first, deploy, gather family feedback, and adjust.

## Repository location

Canonical remote: `git@github.com:Incorpify-LLC/home_study.git`

Recommended local checkout:

```text
~/workspace/personal/family/home_study
```

Product notes that contain family-specific information should stay outside the repository. The repository contains product behavior and anonymized fixtures only—never children’s names, weaknesses, credentials, or uploaded work.

## Current vertical slice

- Cloudflare Worker API with `GET /api/health`
- Responsive, privacy-safe landing page
- Native family sign-in with revocable, eight-hour server-side sessions
- Per-location login abuse throttling and a masked parent-account provisioning command
- D1 baseline schema for users, curriculum, questions, assignments, attempts, mastery, uploads, and delivery records
- Private R2 binding contract for rough-work images
- Local Cloudflare integration tests
- CI and production deployment workflows

Parent and student dashboards, assessments, uploads, and email are deliberately not stubbed as fake functionality. They will be added one tested vertical slice at a time.

## Stack

- TypeScript on Cloudflare Workers
- Workers Static Assets for the web UI
- D1 for relational application state
- Private R2 for rough-work images
- Vitest with the Cloudflare Workers test pool
- ESLint, Prettier, and strict TypeScript
- GitHub Actions for verification and deployment

## Local development

Requirements: Node.js 22+ and npm.

```bash
npm ci
npm run cf-typegen
npm run check
npm run dev
```

Open `http://localhost:8787`. The health endpoint is `http://localhost:8787/api/health`.

Apply the D1 schema locally:

```bash
npx wrangler d1 migrations apply home-study --local
```

Local Wrangler state is kept under `.wrangler/` and is ignored by git.

## TDD workflow

Every behavior change uses a vertical RED–GREEN–REFACTOR cycle:

1. Add one behavioral test.
2. Run only that test and confirm it fails for the expected missing behavior.
3. Add the smallest implementation that passes.
4. Run that test, then the entire suite.
5. Refactor only while green.
6. Run `npm run check` before committing.

Useful commands:

```bash
npm test                       # watch mode
npm run test:run               # all tests once
npx vitest run test/file.ts    # one test file
npm run check                  # formatting, lint, types, tests, dry-run build
```

## Provision the first parent account

Only run this from an interactive terminal on a trusted machine after production migrations are applied:

```bash
npm run provision:parent -- --remote
```

The command requires an explicit production confirmation, asks for the parent’s display name, private sign-in name, optional recovery email, and password. Password entry is hidden. The plaintext password is never written to disk, included in a command-line argument, printed, or sent to chat. A temporary owner-only SQL file contains only the derived password verifier and is deleted after Wrangler finishes.

Use `--local` instead of `--remote` for a local test account. Do not invent or commit family credentials. Student accounts will be created later through the authenticated parent surface rather than this bootstrap command.

Bug fixes require a failing regression test first. Tests assert behavior, not private implementation details.

## Agile delivery

- Keep stories small enough to deploy independently.
- Prefer a complete user-visible slice over several unfinished layers.
- Deploy only from a green `main` branch.
- Gather feedback from the family after each slice.
- Put irreversible or sensitive actions behind explicit parent approval.
- Do not generate pretend data or pretend integrations to make a screen look complete.

The initial backlog is in [`docs/BACKLOG.md`](docs/BACKLOG.md). Architecture decisions are in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Cloudflare setup

Start with the beginner guide in [`docs/CLOUDFLARE_SETUP.md`](docs/CLOUDFLARE_SETUP.md). It asks for one simple dashboard check first, explains every Cloudflare component in plain language, and separates your clicks from the technical work I can do afterward.

The application is intended for `study.saneax.in`, but no Cloudflare resource, DNS record, or automatic deployment is created merely by cloning or pushing this repository. Production deployment is a manual GitHub action until setup is complete.

## Security baseline

- No student personal data in source control or fixtures.
- Every server route must authorize the requested record or object.
- Rough-work objects stay private and use unpredictable keys.
- Passwords, API tokens, and session secrets go in Cloudflare/GitHub secrets, never files.
- Objective scoring may be automatic; subjective or image-based scoring stays reviewable.
- No public leaderboards or sibling comparisons.

## License and access

Private project. Do not redistribute educational content until its source and licensing have been reviewed.
