# Evaluation demo learner

The demo learner exists so the platform can be evaluated from a student's chair without touching a child's account. One identity — `private-address@example.test` — can act as a learner in any class that has reviewed content, work a chapter exactly as a child would, and be reset between demonstrations.

## What the demo learner can do

- **Sit in any class with reviewed content.** Class VIII (Mathematics, Physics), Class X (Mathematics, Physics) and Class XII (Accountancy, Commerce) are selectable, and each chip shows that class's progress (`Class X · 1/30`).
- **Keep or clear progress per class.** Switching class keeps that class's work by default, so a demonstration can carry on from where it stopped. The **Start fresh when switching** toggle, or the **Clear this class** button, resets the class you are entering or standing in. Clearing is scoped to one class — other classes keep their progress.
- **Work a chapter end to end.** Lesson, key points, worked example, every question with a confidence rating, save-as-you-go, one deliberate submission, then the corrections with the reviewed answer and the reason for each mark.
- **See the calendar.** Today's planned chapters and the whole horizon, exactly as a real learner does.
- **Be reviewed from the parent side.** The demo learner is linked to the family parent account, so it appears in the parent's learner list and its evidence and exercises can be opened there like any child's. Its rows are clearly its own — nothing is mixed with a real learner's record.

## What it deliberately cannot do

- It cannot change any real learner's data. Switching class or clearing affects only `demo-student`.
- It cannot switch another account's class, and no non-demo identity can call the demo routes: a real student or a parent receives `403`.
- It cannot be mistaken for a child's record: the interface shows an "Evaluation demo account" badge, and `users.is_demo` marks the row.

## Using it

1. Sign in at `https://study.saneax.in` with `private-address@example.test` and complete the Cloudflare Access one-time PIN.
2. The dashboard shows the demo bar: the current class and its progress, a chip per class, the **Start fresh when switching** toggle, and **Clear this class**.
3. Pick a class and work the chapter as a child would.
4. To review the parent side, sign in as the parent and open **Progress** or **Calendar & exercises** for the demo learner.

## Requirement: the address must be allowed by Cloudflare Access

Access only admits the addresses listed in its policy for the hostname, so `private-address@example.test` must be added there. In **Zero Trust → Access controls → Applications → (the `study.saneax.in` application) → Policies → the Allow policy**, add the address to the **Emails** selector. Receiving an OTP is not by itself permission: the Worker maps the verified email to a D1 role, and the demo row already exists with role `student` and `is_demo = 1`.

If the address is not on the policy, Access denies the request before the Worker ever sees it. That is by design — the allowlist is the outer boundary and should stay short.

## API used by the interface

| Method | Path                | Purpose                                                                         |
| ------ | ------------------- | ------------------------------------------------------------------------------- |
| `GET`  | `/api/demo/classes` | Current class, selectable classes with subject and chapter counts, and progress |
| `POST` | `/api/demo/class`   | `{ "classLevel": "VIII" }` — act as that class and clear progress               |
| `POST` | `/api/demo/reset`   | Clear progress and rebuild the calendar, staying in the current class           |

All three require the demo identity; anything else gets `403` (or `401` when unauthenticated). `/api/session` reports `user.demo` so the interface can show the demo controls and badge.

## Data it writes

The demo learner writes only its own rows: its `student_profiles` row (its class), its `study_settings`, `study_plans`, `study_plan_entries`, `assignments`, `assignment_items`, `assignment_responses`, `attempts` and `mastery_events`. Reset removes them in dependency order — mastery events and uploads first, then attempts, responses, plans, and assignments.
