# Home Study delivery roadmap

Status: authentication foundation deployed; teaching and assessment workflows remain to be built.

This document separates what exists in production from what the product vision still requires. A database table or placeholder panel does not count as a working feature.

## Shipped and verified

- Cloudflare Worker, Static Assets, D1, and private R2 bindings.
- `study.saneax.in` protected by Cloudflare Access email OTP.
- Exactly four pre-provisioned active D1 identities: one parent and three students.
- Worker-side Access JWT signature, issuer, audience, token-type, and expiry checks.
- D1 email-to-role mapping with no native password login or public registration.
- Parent-to-student authorization relationship and parent-only learner listing.
- Separate parent and student application shells.
- Health endpoint, automated tests, CI, manual deployment, and production smoke checks.

## Production reality

The application is currently a secure authenticated shell, not yet a functional learning platform.

These production tables contain no learning records yet:

- `curriculum_topics`
- `questions`
- `assignments`
- `assignment_items`
- `attempts`
- `uploads`
- `mastery_events`
- `report_deliveries`

The current UI therefore cannot teach a lesson, run a diagnostic, accept an answer, score work, upload rough work, schedule revision, or report progress.

## Remaining release gate for authentication

Before treating authentication as fully accepted, complete real browser checks without sharing OTP codes:

1. Each approved family address can complete OTP and reaches the correct role shell.
2. The parent sees exactly the three linked learners.
3. Each student sees only their own shell and cannot list sibling accounts.
4. An unlisted email is denied by Cloudflare Access.
5. Sign-out clears the Access session and permits switching identity.

## Delivery sequence

### Slice 2 — reviewed curriculum and diagnostic

Build one subject end to end before adding every subject.

Required capabilities:

- Subject enrolments and curriculum objectives with source provenance.
- A private staging/review state so web research never publishes directly to a student.
- Reviewed single-choice and numeric questions with answers, rationales, difficulty, and misconception metadata.
- Student diagnostic start, progress save, deliberate submission, and resume behavior.
- Server-side option randomization that preserves answer identity.
- Immediate objective scoring only after submission.
- Topic-level evidence for the parent; no weak/strong label or sibling comparison.

Acceptance: one student can complete one reviewed diagnostic, receive corrections, and the parent can inspect objective-level evidence.

### Slice 3 — daily learning plan

Required capabilities:

- Daily plan containing explanation, worked example, guided practice, independent check, and correction.
- Workload controls for weekday and weekend ranges.
- Parent pause/reduce controls.
- Completion tracking and safe resume.
- Idempotent assignment generation so a retry cannot create duplicate daily work.

Acceptance: the system can generate and complete one bounded daily plan from reviewed diagnostic evidence.

### Slice 4 — private rough-work upload and review

Required capabilities:

- Authorized upload initiation tied to a specific attempt.
- MIME, byte-size, and image-dimension validation.
- Metadata stripping and opaque private R2 keys.
- Authorized read/delete paths with retention controls.
- Parent/reviewer queue, rubric, score override, and audit history.

Acceptance: a student can attach method evidence, only authorized users can view it, and a reviewed override is auditable.

### Slice 5 — correction and retained mastery

Required capabilities:

- Error classification: conceptual, recall, calculation, reading, method, and presentation.
- Required correction flow before an assignment is complete.
- Mastery transitions based on multiple pieces of evidence.
- Delayed reassessment intervals rather than immediate-score-only mastery.
- Student next steps phrased constructively.

Acceptance: a missed concept returns later, and mastery cannot be awarded from one immediate correct answer.

### Slice 6 — parent dashboard and reporting

Required capabilities:

- Per-student completion, independent accuracy, retained mastery, review queue, workload, and next steps.
- No sibling ranking or combined competitive score.
- Preview and explicit approval of report templates.
- Idempotent delivery ledger, retry behavior, and approved recipient allowlist.
- Morning/evening/weekly scheduling only after sender, recipient, cadence, and templates are approved.

Acceptance: the parent can review useful progress in the application; one approved report can be delivered once without duplication.

### Later board-preparation capabilities

- Accounts method and working-note review.
- Constrained external code runner for Computer Science; never arbitrary code in a Worker request.
- Hindi writing and literature review after prescribed texts are confirmed.
- Timed board-format sections and original mock papers with independently verified marks and answer keys.

## Product and data work still required

- Confirm complete subject combinations for the two board-year students.
- Confirm the school programming language and execution environment.
- Obtain the Class VIII school curriculum or chapter list; do not claim a universal board syllabus.
- Confirm prescribed English and Hindi literature texts before text-specific work.
- Collect school/tuition schedules, exam dates, and realistic availability.
- Decide rough-work image retention and deletion policy.
- Approve report sender, recipient, cadence, and templates before enabling email.

Generic foundations can proceed while these inputs are gathered, but any board-coverage claim must wait for verified curriculum sources.

## Definition of a functional private pilot

The pilot is functional only when:

- every family identity passes the authorization checks above;
- at least one reviewed subject diagnostic runs end to end;
- a student receives teaching, practice, assessment, correction, and delayed review—not merely questions;
- the parent sees actionable topic-level evidence and can control workload;
- rough-work privacy and ownership are verified;
- no live-search content reaches a student without review;
- retries cannot duplicate assignments or reports;
- all production changes pass automated tests and an independent review.
