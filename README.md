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
- Cloudflare Access email OTP restricted to pre-approved family identities
- Worker-side Access JWT verification and D1 email-to-role mapping
- Separate parent and student application shells
- Parent-only listing of learners linked through `parent_students`
- Reviewed complete course roadmaps across six subject tracks: Class VIII Mathematics (11 chapters), Class X Mathematics (18 chapters), Class XII Accountancy (12 chapters), Class VIII Physics (8 chapters), Class X Physics (12 chapters, grouped and ordered to the prescribed textbook), and Class XII Commerce (12 chapters)
- Student lesson, worked example, diagnostic, draft save/resume, submission, objective scoring, and corrections
- Per-subject sequential progression: a subject's next chapter unlocks only after the current one is submitted, and progress in one subject never unlocks another
- Subject tabs on the learner dashboard for a class carrying more than one subject
- Parent-set study hours (weekday, weekend, rest days, horizon) with a generated assessment calendar per learner
- A deterministic scheduler that rebuilds the calendar whenever hours, subjects, finished work, or missed days change, rotating fairly across subjects and never splitting a chapter across days
- Parent exercise review: every chapter opens with the lesson, the answer key, rationales, and the learner's own answers and scores
- Evaluation demo learner with a repository-safe identifier that can act as a student in any class with reviewed content, work chapters like a child, and be reset between demonstrations — never touching a real learner's data (`docs/DEMO_USER.md`)
- Parent evidence view scoped to explicitly linked learners
- D1 schema for source provenance, reviewed content, assignment templates, responses, attempts, mastery, uploads, and delivery records
- Private R2 binding contract for rough-work images
- Local Cloudflare integration tests
- CI and production deployment workflows

The reviewed course roadmaps for all six subject tracks are functional. Rough-work upload/review, delayed reassessment, adaptive assignment, and email reports remain later tested slices; the interface does not pretend those capabilities exist.

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

## Provision family identities

Production identities are created privately in D1 and must also appear in the exact-email Cloudflare Access Allow policy. The application has no public registration, password login, learner-creation route, or just-in-time account creation. Never commit family names or addresses to fixtures, documentation, migrations, or source code.

Bug fixes require a failing regression test first. Tests assert behavior, not private implementation details.

## Agile delivery

- Keep stories small enough to deploy independently.
- Prefer a complete user-visible slice over several unfinished layers.
- Deploy only from a green `main` branch.
- Gather feedback from the family after each slice.
- Put irreversible or sensitive actions behind explicit parent approval.
- Do not generate pretend data or pretend integrations to make a screen look complete.

The initial backlog is in [`docs/BACKLOG.md`](docs/BACKLOG.md), the current delivery gaps are in [`docs/DELIVERY_ROADMAP.md`](docs/DELIVERY_ROADMAP.md), the curriculum source register is in [`docs/CURRICULUM_SOURCES.md`](docs/CURRICULUM_SOURCES.md), and architecture decisions are in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Cloudflare setup

Start with the beginner guide in [`docs/CLOUDFLARE_SETUP.md`](docs/CLOUDFLARE_SETUP.md). It asks for one simple dashboard check first, explains every Cloudflare component in plain language, and separates your clicks from the technical work I can do afterward.

The application is intended for `study.saneax.in`, but no Cloudflare resource, DNS record, or automatic deployment is created merely by cloning or pushing this repository. Production deployment is a manual GitHub action until setup is complete.

## Security baseline

- No student personal data in source control or fixtures.
- Every server route must authorize the requested record or object.
- Rough-work objects stay private and use unpredictable keys.
- API tokens, OTPs, and recovery codes go only through their protected systems, never source files or chat.
- Objective scoring may be automatic; subjective or image-based scoring stays reviewable.
- No public leaderboards or sibling comparisons.

## License and access

Private project. Do not redistribute educational content until its source and licensing have been reviewed.
