# Agile Backlog

Items are ordered by delivery value. Each story must have acceptance tests before implementation.

The production gap analysis and end-to-end acceptance criteria are maintained in [`DELIVERY_ROADMAP.md`](DELIVERY_ROADMAP.md).

## Shipped foundation

- [x] Worker and static-assets runtime
- [x] Health endpoint
- [x] Privacy-safe responsive landing page
- [x] D1/R2 binding contracts and initial schema
- [x] Local integration test harness
- [x] CI and deployment workflows

## Slice 1 — family authentication

**Outcome:** A parent and student can sign in and see only their permitted shell.

Acceptance direction:

- Parent and student roles are enforced server-side.
- Cloudflare Access allows only explicitly approved email identities through email OTP.
- The Worker verifies Access JWT signature, issuer, audience, type, and expiry before D1 lookup.
- A student cannot read another student’s records by changing an identifier.
- No native password login or public registration exists.

Delivery order:

- [x] A valid Cloudflare Access JWT resolves a pre-provisioned active D1 identity.
- [x] Invalid signature, issuer, audience, type, and time claims are rejected.
- [x] Unmapped identities receive no application role.
- [x] Cloudflare Access provides the session and email OTP flow.
- [x] A parent can list only the students linked to that parent.
- [x] An authenticated parent or student sees only their permitted application shell.
- [x] Native login, password reset, learner creation, and public registration routes are absent.

## Slice 2 — diagnostic assessment

**Outcome:** A student completes a small reviewed diagnostic and the parent sees topic-level evidence.

- Deliver one subject end to end before broadening.
- Start with MCQ/numeric questions.
- Randomize option order without changing answer identity.
- Save progress safely and permit deliberate submission.
- Report concepts and evidence, not a weak/strong label.

## Slice 3 — daily assignment

**Outcome:** The system creates a bounded daily plan from diagnostic evidence.

- Respect weekday/weekend workload limits.
- Include recall, learning, practice, independent assessment, and correction.
- Maintain stronger subjects while emphasizing priority concepts.
- Parent can reduce or pause workload.

## Slice 4 — rough-work upload

**Outcome:** A student attaches a private image to a selected attempt.

- Validate size and media type.
- Strip unnecessary metadata before durable storage.
- Use private R2 and opaque keys.
- Enforce ownership on upload/read/delete.
- Parent can delete an upload according to retention policy.

## Slice 5 — correction and mastery

**Outcome:** Missed concepts return on a spaced schedule and mastery requires delayed evidence.

- Distinguish conceptual, recall, calculation, reading, and presentation errors.
- One immediate correct answer cannot set `mastered`.
- Show the child constructive next steps.

## Slice 6 — parent reporting

**Outcome:** An approved weekly report is delivered once to the parent.

- Preview before enabling automatic send.
- Idempotent delivery and retry ledger.
- No sibling ranking.
- Include completion, independent accuracy, delayed retention, workload, review queue, and next steps.

## Later slices

- Accounts method marking
- Sandboxed code runner for Computer Science
- Hindi writing and literature review
- Board-format timed sections
- Complete original mock papers with verified mark totals and answer keys
- Curriculum ingestion/review console
