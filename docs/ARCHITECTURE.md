# Architecture

## Product boundary

Home Study is a private family application. It creates daily learning plans, administers mostly objective assessments, accepts rough-work images, tracks retained mastery, and reports progress to the parent. It does not rank siblings and does not treat one immediate correct answer as mastery.

## Runtime

```text
Browser / PWA
     │ HTTPS
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

The application uses native family credentials so a student does not need a stable email account. Passwords are never stored directly: the Worker verifies a deliberately slow, salted password-derived key and keeps only its encoded verifier in D1. Login errors do not reveal whether an account exists.

Sessions are opaque random tokens. D1 stores only a SHA-256 digest of each token, together with its user, expiry, and revocation state. The browser receives the original token in a `Secure`, `HttpOnly`, `SameSite=Strict` cookie. Authorization always loads the session and user from D1; it never trusts a role or student identifier supplied by the browser.

Cloudflare’s Rate Limiting binding reduces repeated login attempts by edge-observed actor and a SHA-256 digest of the normalized sign-in name before password derivation. It is a permissive, per-location abuse control rather than an exact account lockout: short bursts can exceed the configured threshold before a later request receives HTTP 429. The first parent account is created only through an explicitly local-or-remote, interactive command with non-echoing password input. Student accounts will be parent-managed rather than bootstrapped from public registration.

The parent/admin surface may receive an additional Cloudflare Access policy later as defence in depth. Parent-controlled student-password reset and parent recovery remain separate follow-up stories.

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
