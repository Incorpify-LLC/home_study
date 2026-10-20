# Architecture

## Product boundary

Home Study is a private family application. It creates daily learning plans, administers mostly objective assessments, accepts rough-work images, tracks retained mastery, and reports progress to the parent. It does not rank siblings and does not treat one immediate correct answer as mastery.

## Runtime

```text
Browser / PWA
     │ HTTPS
     ▼
Cloudflare Access (exact-email OTP policy)
     │ signed application JWT
     ▼
Cloudflare Worker ───── Static Assets
     │
     ├── D1: accounts, curriculum, questions, plans, attempts, mastery
     ├── R2: private rough-work images and generated reports
     ├── Queue / Workflow: later, for OCR, grading, and reports
     └── Email binding/provider: later, parent-approved reports only
```

The Worker owns authorization. A browser-supplied student ID, attempt ID, or R2 key is never trusted without checking the authenticated account’s role and ownership.

## Planned bounded modules

- **Identity:** family accounts, parent recovery, secure sessions, role checks
- **Curriculum:** source provenance, board/year versions, review state
- **Question bank:** immutable published versions, answers and rationales
- **Assignment:** diagnostics, workload limits, daily scheduling
- **Assessment:** attempts, objective scoring, confidence and timing
- **Review:** rough-work and subjective review with auditable overrides
- **Mastery:** delayed evidence and topic-state transitions
- **Reporting:** parent summaries and idempotent delivery

Modules may share one Worker and D1 database during the prototype. Boundaries are logical, not premature microservices.

## Data decisions

- IDs are application-generated opaque identifiers.
- Timestamps are stored as UTC ISO-8601 text.
- Published questions are versioned rather than edited in place.
- Uploaded objects are private. D1 records own metadata and lifecycle state.
- Report delivery uses a unique idempotency key to prevent duplicate email.
- Migrations become append-only once applied to any shared environment.

## Authentication direction

Cloudflare Access authenticates the parent and students using email one-time PINs. Its application policy is deny-by-default and allows only explicitly listed email addresses. The application exposes no native login, password reset, or public registration endpoint.

The Worker independently verifies the Access application JWT: `RS256` signature, key ID, issuer, application audience, token type, and time claims. It then normalizes the verified email and resolves it to a pre-created active D1 user. A browser-supplied email header never grants a role. The test identity header works only when the local Miniflare-only `ACCESS_TEST_MODE` binding is set and that binding must never exist in production.

Cloudflare Access proves identity; D1 remains the application authorization source. `parent_students` is the boundary for parent access to learner records, and students receive no route that enumerates sibling accounts. Unknown or inactive D1 identities remain unauthenticated even if they somehow reach the Worker with a valid Access token.

## Content provenance

Curriculum sources and question sources are separate:

- Official board material defines scope and format.
- Open, licensed sources may inform explanations.
- Questions are original and reviewed before assignment.
- Live web-search output never publishes directly to a student.
- Literature-specific material waits for prescribed-text confirmation.

## Deployment flow

1. Pull request runs `npm run check`.
2. Merge to `main` repeats verification.
3. Production workflow applies D1 migrations.
4. Wrangler deploys the Worker and static assets.
5. A remote health test verifies `study.saneax.in/api/health`.

Production secrets are scoped to the GitHub `production` environment. Configure an approval rule there if the GitHub plan supports it.
