# Study scheduler

The scheduler turns a learner's outstanding chapters into a dated assessment calendar that fits the study time a parent sets. It is the piece that keeps the plan honest when anything changes: hours, subjects, finished work, or missed days.

## What the parent controls

Per learner, a parent sets:

- **Weekday study time** in minutes (30–480, default 120).
- **Weekend study time** in minutes (30–480, default 300).
- **Rest days**, any of Monday–Sunday (default Sunday).
- **Planning horizon** in days (7–90, default 28).

Changing any of these rebuilds the calendar immediately and records why in the plan's `change_reason`.

## Rules the calendar always obeys

1. **A day never exceeds its budget.** A weekday uses the weekday minutes, a Saturday or Sunday the weekend minutes, a rest day zero.
2. **A chapter is never split across days.** Chapters run 35–75 minutes, so a day may finish slightly under budget rather than starting a chapter it cannot hold.
3. **Subjects rotate.** With several subjects, each active day takes work from each subject in turn, so no subject is starved while another is drained.
4. **Work is never lost.** Unfinished chapters are simply scheduled again. A chapter missed yesterday appears on the next day with room.
5. **Finished work is never rescheduled.** A submitted chapter leaves the pending set, so it cannot come back.
6. **Nothing is silently dropped.** Chapters that do not fit inside the horizon are reported as `unscheduled` with a count in the interface, so the parent can extend the horizon or raise the hours.
7. **The same inputs give the same calendar.** The engine is a pure function, so a rebuild is comparable with what the learner already had.

## When the calendar rebuilds

| Trigger                                                         | `change_reason`  |
| --------------------------------------------------------------- | ---------------- |
| First calendar for a learner                                    | `initial`        |
| Parent changes study hours, rest days, or horizon               | `hours_changed`  |
| A subject appears with new chapters, or the pending set changes | `course_changed` |
| A chapter is submitted, or the horizon has expired              | `roll_forward`   |
| Parent presses "Rebuild calendar now"                           | `manual`         |

The learner's own dashboard reads the same calendar, and the "Today's plan" panel shows the day's allocated minutes against its budget. The current chapter a learner is asked to open follows the calendar for that subject.

## Parent verification of exercises

The parent calendar lists every chapter with its minutes and state (planned, completed, or not submitted). Selecting a chapter opens the reviewed exercise: lesson, key points, worked example, every question with its correct answer and rationale, the learner's own answer, and the score once submitted. This is how a parent checks what the child was actually asked to do and why an answer was marked wrong.

## Data model

- `study_settings` — the parent-set minutes, rest days, and horizon for one learner.
- `study_plans` — one active row per learner, with revision number, date range, the settings it was built from, and the change reason. Revisions are kept so a rebuild can be explained later.
- `study_plan_entries` — one row per chapter per day, with allocated minutes, order within the day, and state.

## API

| Method | Path                                                    | Purpose                                                       |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------- |
| `GET`  | `/api/parent/learners/:id/plan`                         | The calendar, regenerated if the inputs moved on              |
| `PUT`  | `/api/parent/learners/:id/study-settings`               | Save hours, rest days, horizon, then rebuild                  |
| `POST` | `/api/parent/learners/:id/plan/reschedule`              | Rebuild with the current settings                             |
| `GET`  | `/api/parent/learners/:id/exercises?subject=&sequence=` | Reviewed exercise with answer key and the learner's responses |
| `GET`  | `/api/learning/plan`                                    | The learner's own calendar and today's work                   |

All parent routes require a parent identity linked to that learner through `parent_students`; an unlinked parent receives `403`.
