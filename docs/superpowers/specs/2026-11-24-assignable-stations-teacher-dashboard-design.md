# Assignable stations and teacher dashboard: design

Date: 2026-11-24 · Status: awaiting approval · Project 1 of 2 (project 2: the bench-workflow science module)

## Intent

SIASET is meant for students and teachers together. The usual first real use is a teacher bringing a class in. Today a teacher can create a class and post file-upload assignments, but cannot point students at stations or see how they did. The landing page currently claims "Pick stations and see who has completed them", which is not true yet.

This project makes that claim true. A teacher assigns stations and then sees, per student and per station, whether it is done and how the student answered. That's what a teacher checks after the first class, and it's what makes the classroom part of SIASET worth adopting.

## Goals

- A teacher can attach one or more stations to an assignment, chosen from every field and module.
- The teacher gets an assignment dashboard: students × stations, with status, per-question answers and correctness, and per-station totals.
- A student sees the assigned stations on their assignment card, with their own status and a link to each station.
- "Done" means exactly what the student's own Notebook means, including progress made before the assignment existed.

## Non-goals

- Changing how progress is recorded or synced (`progress_ops`, the dual-write to `learner-write`).
- Grading stations automatically, or certifying results.
- Teacher views of stations that are not assigned, or of students outside their classes.
- Schools, seats, plans or billing (later SaaS projects).
- New science content (project 2).

## Anti-goals (a failure even if it works)

- A teacher can see or infer a student's progress on anything other than the stations they assigned to that student's class.
- A teacher, or a student, can change another student's progress through this feature.
- The dashboard says "Done" when the student's own Notebook does not, or the other way round.
- Experiment logic, scoring or saved-progress formats change.

## Constraints (from the current code)

- **Progress is owner-only.** `public.progress_ops` RLS lets only the owner read their rows. Each row is one immutable progress entry, an op `{version, id, clock, type, …}`.
- **Completion rules live in the browser.** They use `lessonProgress.isComplete` for lessons and `learnerRecords.validLabEvidence`/`topicCompleted` for labs. The entry log is replayed in `(clock, id)` order by `progressRepository.js` (`apply`).
- **How entries name stations:**
  - Lesson entries carry `lessonId`, with types `lesson` and `resetLesson`.
  - Lab entries carry `record.scenario`: `tn5` for topic `conservative` and `tn3` for topic `replicative`.
  - Assessment entries (`attempt`, `resetAttempts`) belong to no station.
- **Classroom schema.**
  - Tables: `classes`, `class_members(display_name)`, `assignments(title, instructions, due_at)` and `submissions` (file-based, graded through `grade_submission`).
  - Helpers: `teaches_class(class)` and `in_class(class)`.
  - Column grants restrict what browsers may write.
- **Station ids** are the curriculum topic ids (`allTopics` in `curriculum/modules.js`, 18 today across 2 fields). They must stay stable, because saved progress is keyed by them.

## Approaches considered

| Approach | How | Trade-offs |
|---|---|---|
| **A. Teacher reads class members' progress for assigned stations (chosen)** | A security-definer function returns, for an assignment the caller teaches, each member's progress entries limited to the assigned stations. The teacher's browser replays them with the same rules students use. | One source of truth. Earlier progress counts. Students' browsers write nothing new. The data is student-written, so no more tamper-proof than today. |
| B. Students report results | On completing an assigned station, the student's browser saves a result row. | Simple query. But it's a second copy that can drift or be missed offline, and only completions after assigning count. |
| C. Server-checked `learner-write` tables | The teacher reads `lesson_progress` / `lab_reviews`. | Strongest data. But it only holds progress since the 2026-11-24 dual-write (no import), and the completion rules would need re-implementing in SQL. |

The user picked **A**.

## Design

### Data (one migration)

- **`assignments.stations`:** a new `text[] not null default '{}'` column.
  - Check: at most 18 entries, each matching `^[a-z0-9-]{1,64}$`, no duplicates.
  - Order is the teacher's order. Add `stations` to the existing column grants for insert and update.
  - Unknown ids are tolerated by the database (the curriculum can change) and hidden by the UI.
- **New function `public.assignment_station_progress(p_assignment uuid)`:**
  - Security definer, `set search_path = ''`, stable.
  - Returns a table of `(user_id uuid, display_name text, op jsonb)`.
  - Returns rows only when `public.teaches_class(public.assignment_class(p_assignment))`; otherwise zero rows (no error, nothing leaked).
  - Joins `class_members` of that class to `progress_ops`, keeping an entry only when:
    - `op->>'type' in ('lesson','resetLesson')` and `op->>'lessonId'` is one of the assignment's station ids, or
    - `op->>'type' = 'lab'` and `op->'record'->>'scenario'` is the scenario of an assigned lab station (`conservative` → `tn5`, `replicative` → `tn3`).
  - The mapping is held in a small SQL `case`, listed next to the curriculum ids.
  - Members with no matching entries still return one row with `op = null`, so every student appears.
  - Grant execute to `authenticated` only.
- **No change** to `progress_ops` policies, to `learner-write`, or to any experiment or progress file.

### Shared logic (frontend, no behaviour change)

- **Export a pure `replayProgress(ops)`** from `progressRepository.js`: the existing `compare` plus `apply` loop over a list of entries, returning `{progress, labs, attempts}`. The repository uses it internally, so behaviour is identical and covered by the existing tests.
- **New `ui/classroom/stationResults.js`** (read-only):
  - `studentStationResult(topic, state)` returns `{status: 'done'|'progress'|'new', detail}`.
    - It reuses `topicCompleted` and the lesson definitions (`lessonById`).
    - `detail` for a lesson: views inspected out of total, and each required question (`exercise`, `check`, `check2`) with the chosen option text and correctness.
    - `detail` for a lab: whether a saved, valid review exists, and its checkpoint answers.
  - `stationTotals(results)` returns per station the number of students done and the most-missed question.

### Teacher screens (`classroom/TeacherClasses.jsx`)

- **Assignment form:** a station picker grouped by field → module. Each item shows the station number and title, with search reusing the station finder's matching. Selected stations show as removable chips in the chosen order. Title, instructions and due date are unchanged; file upload stays available and becomes optional for station assignments.
- **Assignment dashboard** (opened from each assignment):

```
Assignment: Mobile DNA basics · due Fri 28 Nov        8 of 24 complete
              06 Tn5 lab     13 TSD         File
Amira K.      ✓ Done         ◐ 2/4 views    ✓ report.pdf
Ben T.        ○ Not started  ◐ 1/4 views    —
Chloé M.      ✓ Done         ✓ Done         ✓ notes.pdf   (late)
Totals        14/24          9/24           11 files
Most missed   —              Check 2        
```

  - Clicking a cell opens that student's detail for that station.
  - The File column shows the existing submission and grading, unchanged.
  - "Complete" for the headline means every assigned station is done. Assignments have no "file required" flag, so files are shown and graded as today but never count towards completion. A file-only assignment keeps today's view.
  - Lessons can be Done, In progress (some views or answers recorded) or Not started. Labs save only completed reviews, so a lab is Done or Not started.
  - The dashboard shows synced progress only. Students in a class are signed in, so their progress syncs; changes made offline appear after their next sync.
  - The data loads once on open, with a Refresh button. There's no live updating.
- **States:**
  - Loading (skeleton rows).
  - No students yet: show the join code to share.
  - No stations assigned: the file-only view, as today.
  - The function fails: friendly error plus retry.
  - A student has left the class: not shown.

### Student screen (`classroom/MyClasses.jsx`)

- The assignment card lists its stations: number, title, the student's own status (from their local progress, the same as the Lab room), and "Open station" linking to the station.
- One line on the card: "Your teacher can see your progress and answers on these stations."
- File upload stays as today.

### Copy fix

- Keep the landing page's teacher section ("Pick stations and see who has completed them"); it becomes true with this work. If this project is dropped, remove that line.

## Security and privacy checks (tests)

- **Caller who doesn't teach the class:** a non-teacher, a student in the class, or the teacher of another class gets zero rows.
- **Station filtering:**
  - Entries for unassigned stations are never returned.
  - Assessment entries are never returned.
  - Students outside the class are never returned.
- **Writes:** students cannot write `assignments.stations`.
- **Correct replay:** `resetLesson` entries are returned with lesson entries, so a reset after an answer shows "Not started".

## Testing

- **db2 (PGlite):**
  - The migration applies.
  - The function returns the right rows for a teacher and none for anyone else.
  - Filtering is correct, including the `resetLesson` and lab-scenario mapping.
  - Members without progress appear with `op = null`.
  - The column check rejects bad station lists.
- **Frontend unit tests:**
  - `replayProgress` matches the repository's state for the same entries.
  - `studentStationResult` gives the same done/not-done as `topicCompleted` for each fixture, and `stationTotals` is right.
- **Browser check:** create a class, assign stations 06 and 13, complete one as a student, and confirm the dashboard shows Done for that station.

## Decided by the user

- Start with assignable stations and the teacher dashboard; the bench-workflow science module comes next.
- Approach A.

## Builder's calls (the builder can change these without changing what gets built)

- The `stations` column, not a join table.
- At most 18 stations per assignment.
- The lab topic → scenario mapping in the SQL function is a short list. Adding a new lab station (e.g. in project 2) means adding one line there and a test.
- Refresh on demand, not live.
- The student-facing privacy line wording.
- Grouping in the picker is field → module.
- File upload is optional when stations are attached.
- The "Most missed" row shows the question label (Applied reasoning / Check / Check 2) for the most frequent wrong answer, and a dash when nobody has a wrong answer.
