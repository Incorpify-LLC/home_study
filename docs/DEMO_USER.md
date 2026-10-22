# Evaluation demo learner

The demo learner exists so the platform can be evaluated from a student's chair without touching a child's account. The repository-safe identity `demo-student` can act as a learner in any class that has reviewed content, work a chapter exactly as a child would, and be reset between demonstrations.

## What the demo learner can do

- **Sit in any class with reviewed content.** Class VIII (Mathematics, Physics), Class X (Mathematics, Physics) and Class XII (Accountancy, Commerce) are selectable, and each chip shows that class's progress (`Class X · 1/30`).
- **Keep or clear progress per class.** Switching class keeps that class's work by default, so a demonstration can carry on from where it stopped. The **Start fresh when switching** toggle, or the **Clear this class** button, resets the class you are entering or standing in. Clearing is scoped to one class — other classes keep their progress.
- **Work a chapter end to end.** Lesson, key points, worked example, every question with a confidence rating, save-as-you-go, one deliberate submission, then the corrections with the reviewed answer and the reason for each mark.
- **See the calendar.** Today's planned chapters and the whole horizon, exactly as a real learner does.
- **Be reviewed from the demo parent side.** The demo learner is linked only to `demo-parent`, so its evidence and exercises can be reviewed without exposing it to any family account. Its rows are clearly its own — nothing is mixed with a real learner's record.

## What it deliberately cannot do

- It cannot change any real learner's data. Switching class or clearing affects only `demo-student`.
- It cannot switch another account's class, and no non-demo identity can call the demo routes: a real student or a parent receives `403`.
- It cannot be mistaken for a child's record: the interface shows an "Evaluation demo account" badge, and `users.is_demo` marks the row.

## Using it

1. Open `https://study.saneax.in` and use the evaluation demo sign-in panel with the `demo-student` identifier.
2. The dashboard shows the demo bar: the current class and its progress, a chip per class, the **Start fresh when switching** toggle, and **Clear this class**.
3. Pick a class and work the chapter as a child would.
4. To review the parent side, sign in with the `demo-parent` identifier and open **Progress** or **Calendar & exercises** for the demo learner.

## Authentication boundary

Cloudflare Access should list only approved family addresses. The evaluation demo uses the application's separate credential path, and the Worker accepts that path only for D1 users marked `is_demo = 1`; no demo mailbox belongs in public documentation or fixtures.

Family accounts continue to use Cloudflare Access email OTP. Demo cookie sessions are time-bounded, revocable, and ignored unless the matched user is active and marked `is_demo = 1`.

A new demo password is established only through a high-entropy, single-use enrolment code. Store only its SHA-256 hash in D1, issue the link as `https://study.saneax.in/#demo-enrol=[ONE-TIME-CODE]`, and deliver it through a private channel. The fragment keeps the code out of HTTP request logs, and the page removes it from browser history immediately. Codes expire after 24 hours; passwords must contain 12–128 characters.

## API used by the interface

| Method | Path                | Purpose                                                                         |
| ------ | ------------------- | ------------------------------------------------------------------------------- |
| `GET`  | `/api/demo/classes` | Current class, selectable classes with subject and chapter counts, and progress |
| `POST` | `/api/demo/class`   | `{ "classLevel": "VIII" }` — act as that class and clear progress               |
| `POST` | `/api/demo/reset`   | Clear progress and rebuild the calendar, staying in the current class           |

All three require the demo identity; anything else gets `403` (or `401` when unauthenticated). `/api/session` reports `user.demo` so the interface can show the demo controls and badge.

## Data it writes

The demo learner writes only its own rows: its `student_profiles` row (its class), its `study_settings`, `study_plans`, `study_plan_entries`, `assignments`, `assignment_items`, `assignment_responses`, `attempts` and `mastery_events`. Reset removes them in dependency order — mastery events and uploads first, then attempts, responses, plans, and assignments.
