# Evaluation demo learner

The demo learner exists so the platform can be evaluated from a student's chair without touching a child's account. One identity — `private-address@example.test` — can act as a learner in any class that has reviewed content, work a chapter exactly as a child would, and be reset between demonstrations.

## What the demo learner can do

- **Sit in any class with reviewed content.** Class VIII (Mathematics, Physics), Class X (Mathematics, Physics) and Class XII (Accountancy, Commerce) are selectable. Switching class rewrites the learner's class and clears its progress, so the new class starts at chapter one.
- **Work a chapter end to end.** Lesson, key points, worked example, every question with a confidence rating, save-as-you-go, one deliberate submission, then the corrections with the reviewed answer and the reason for each mark.
- **See the calendar.** Today's planned chapters and the whole horizon, exactly as a real learner does.
- **Start fresh at any time.** A single button clears the demo's assignments, answers, attempts, mastery events and calendar, then rebuilds the calendar from scratch.

## What it deliberately cannot do

- It cannot see or change any real learner's data. It is not linked to the parent account through `parent_students`, so it never appears in the parent's learner list.
- It cannot switch another account's class, and no non-demo identity can call the demo routes: a real student or a parent receives `403`.
- It cannot be mistaken for a child's record: the interface shows an "Evaluation demo account" badge, and `users.is_demo` marks the row.

## Using it

1. Sign in at `https://study.saneax.in` with `private-address@example.test` and complete the Cloudflare Access one-time PIN.
2. The dashboard shows the demo bar: the current class, how many chapters are done, a button per class, and **Start fresh**.
3. Pick a class and work the chapter as a child would.

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
