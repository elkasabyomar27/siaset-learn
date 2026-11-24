# Assignable Stations and Teacher Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teachers attach stations to assignments and see each student's status and answers on those stations; students see the assigned stations on their assignment card.

**Architecture:**
- Assignments gain a `stations text[]` column.
- A security-definer SQL function returns class members' `progress_ops` entries filtered to the assigned stations, and only to the class's teacher.
- The teacher's browser replays those entries with the same rules the student's Notebook uses (`replayProgress` + `topicCompleted`), then renders a students × stations grid.

**Tech Stack:**
- React 19 and React Router 7 (Vite)
- Supabase (Postgres RLS and RPC)
- Node `node:test`
- PGlite db2 tests

**Spec:** `docs/superpowers/specs/2026-11-24-assignable-stations-teacher-dashboard-design.md`

## Global Constraints

- No change to experiment logic, `engine/*`, `learning.js`, `storyLab.js`, `progress_ops` policies, `learner-write`, or saved-progress formats.
- **Completion:**
  - "Done" must equal `topicCompleted(topic, progress, labs)` from `features/transposable-elements/learnerRecords.js`.
  - Lessons: Done / In progress / Not started.
  - Labs: Done / Not started.
- **Teachers see:**
  - only students in classes they teach (`public.teaches_class`);
  - only assigned stations;
  - read-only, never assessment entries.
- **Station ids** are curriculum topic ids (`allTopics` in `curriculum/modules.js`).
  - The lab mapping is `conservative` → `tn5` and `replicative` → `tn3`, i.e. `topic.learning.experiment`.
- **`assignments.stations`:**
  - at most 18 entries;
  - each matching `^[a-z0-9-]{1,64}$`;
  - no duplicates;
  - default `'{}'`.
- Station-assignment completion counts stations only; files are shown and graded as today but never count.
- Privacy line on the student card, verbatim: `Your teacher can see your progress and answers on these stations.`
- The dashboard loads once on open, with a Refresh button. There's no live updating.
- Brand palette only (tokens in `theme.css`, existing `lab-*` / `class-*` classes).
- Touch targets ≥ 44px. Every control has a label.

## Review Focus

- A student removed from the class must vanish from the dashboard and their entries must not be returned → test in Task 1.
- An assignment whose `stations` includes an id no longer in the curriculum renders without crashing and just skips it → test in Task 3.
- A `resetLesson` after correct answers makes that lesson "Not started", even when the reset comes from a different device (ordered by `(clock, id)`) → tests in Tasks 1 and 2.
- A teacher of another class, or a student of this class, calling the function gets zero rows → test in Task 1.
- A member with no progress still appears as one row with `op = null` and shows "Not started" for every station → tests in Tasks 1 and 3.

---

### Task 1: Database — `stations` column and `assignment_station_progress`

**Files:**
- Create: `supabase/migrations/20261124130000_assignment_stations.sql`
- Test: `tests/db2/assignmentStations.test.mjs`

**Interfaces:**
- Produces:
  - Column `public.assignments.stations text[] not null default '{}'`, writable by teachers through the existing insert and update grants with `stations` added.
  - RPC `public.assignment_station_progress(p_assignment uuid) returns table (user_id uuid, display_name text, op jsonb)`, executable by `authenticated`.

- [ ] **Step 1: Write the failing tests** in `tests/db2/assignmentStations.test.mjs`.
  - Use `database()` and `asRole()` from `tests/db2/database.mjs`.
  - Seed `auth.users` ids teacherA, teacherB, studentA, studentB.
  - Mark teachers as approved teachers the way `tests/db2/classroom.test.mjs` does.
  - Seed rows as `service_role`:
    - class X (teacherA) with members studentA and studentB;
    - assignment with `stations = '{conservative,tsd}'`.
  - Seed studentA's `progress_ops` entries, as `{version:1,id,clock,type,...}` JSON:
    - a `lesson` tsd inspect;
    - a `lesson` introduction inspect (not assigned);
    - a `lab` with `record.scenario = 'tn5'`;
    - a `lab` with `record.scenario = 'tn3'` (not assigned);
    - an `attempt`;
    - a `resetLesson` tsd.
  - Tests:
    - `teacher gets only assigned-station entries for class members`: as teacherA, rows for studentA are exactly the tsd `lesson` op, the tsd `resetLesson` op and the tn5 `lab` op (assert the op ids). studentB appears once with `op === null`.
    - `non-teachers get nothing`: as teacherB, and as studentA, `select count(*) from public.assignment_station_progress($1)` equals `0`.
    - `removed students disappear`: after deleting studentB from `class_members`, teacherA's rows contain no studentB.
    - `stations column is validated`: as teacherA, updating `stations` to 19 ids, to `'{Bad_Id}'` or to `'{tsd,tsd}'` throws. Updating to `'{tsd}'` succeeds.
    - `students cannot set stations`: as studentA, updating `stations` throws.

- [ ] **Step 2: Run to verify it fails**
  - Run: `node --test tests/db2/assignmentStations.test.mjs`
  - Expected: FAIL (column / function does not exist).

- [ ] **Step 3: Write the migration** `20261124130000_assignment_stations.sql`:
  - `alter table public.assignments add column stations text[] not null default '{}'`.
  - The check uses an immutable helper function `public.valid_station_list(text[]) returns boolean`, which verifies:
    - `cardinality(s) <= 18`;
    - every element matches `'^[a-z0-9-]{1,64}$'`;
    - `cardinality(s) = (select count(distinct x) from unnest(s) x)`.
  - Re-grant `insert (class_id, title, instructions, due_at, stations), update (title, instructions, due_at, stations)` on `public.assignments` to `authenticated`.
  - The function is `language sql stable security definer set search_path = ''`:
    - It returns members of `public.assignment_class(p_assignment)` only when `public.teaches_class(...)`.
    - It left-joins `public.progress_ops` on `user_id`, with the filter `(op->>'type' in ('lesson','resetLesson') and op->>'lessonId' = any(stations)) or (op->>'type' = 'lab' and op->'record'->>'scenario' = any(<lab scenarios of stations>))`.
    - Lab scenarios come from `case` over the station ids: `'conservative'` → `'tn5'`, `'replicative'` → `'tn3'`.
  - Revoke the function from `public` and `anon`; grant execute to `authenticated`.

- [ ] **Step 4: Run to verify it passes**
  - Run: `npm run test:db2`
  - Expected: all tests pass (44 existing + the new ones).

- [ ] **Step 5: Commit**
  - `git add supabase/migrations/20261124130000_assignment_stations.sql tests/db2/assignmentStations.test.mjs && git commit -m "Add assignment stations and teacher station-progress function"`

### Task 2: `replayProgress` — shared replay of progress entries

**Files:**
- Modify: `frontend/src/features/transposable-elements/progressRepository.js`
  - The `compare`/`apply` functions are at about lines 8 and 37.
  - `publish()` applies the known entries.
- Test: `frontend/src/features/transposable-elements/tests/replayProgress.test.js`

**Interfaces:**
- Produces: `export function replayProgress(ops: Array<op>, base = {progress:{}, labs:{}, attempts:[]}): {progress, labs, attempts}`.
  - It ignores entries failing `validOperation`.
  - It sorts by `(clock, id)` and does not mutate its inputs.

- [ ] **Step 1: Write the failing tests:**
  - `replay matches the repository`: build a repository with `createProgressRepository({storage: () => memory, makeId})`. Record lesson, reset and lab entries. Assert `replayProgress(storedOps)` deep-equals `repository.getSnapshot()`'s `{progress, labs, attempts}`.
  - `order is by clock then id, not array order`: given `[resetLesson clock 5, lesson inspect clock 3]`, `progress.tsd` is `undefined`.
  - `invalid entries are skipped`: an op with `version: 2` doesn't change the state.

- [ ] **Step 2: Run to verify it fails**
  - Run: `node --test frontend/src/features/transposable-elements/tests/replayProgress.test.js`
  - Expected: FAIL (`replayProgress` is not exported).

- [ ] **Step 3: Extract `replayProgress`** from the existing `publish()` logic. Have `publish()` call it, so repository behaviour is unchanged.

- [ ] **Step 4: Run to verify it passes**
  - Run: `npm test`
  - Expected: all tests pass (130 existing + new).

- [ ] **Step 5: Commit**
  - `git commit -am "Export replayProgress for read-only views"` (after `git add` of the test).

### Task 3: `stationResults.js` — per-student, per-station results

**Files:**
- Create: `frontend/src/classroom/stationResults.js`
- Test: `frontend/src/features/transposable-elements/tests/stationResults.test.js`

**Interfaces:**
- Consumes: `replayProgress` (Task 2); `topicCompleted` (`learnerRecords.js`); `lessonById` (`curriculum/lessons.js`); `allTopics` (`curriculum/modules.js`).
- Produces:
  - **`assignedTopics(stationIds: string[]): Topic[]`** returns topics in the given order and drops unknown ids.
  - **`buildResults(rows: Array<{user_id, display_name, op}>, topics: Topic[]): Array<{userId, name, stations: Record<topicId, Result>}>`**
    - One entry per user, sorted by name.
    - `Result = {status:'done'|'progress'|'new', detail}`.
  - **Lesson detail:** `{kind:'lesson', inspected:number, views:number, questions:[{key:'exercise'|'check'|'check2', label:'Applied reasoning'|'Knowledge check'|'Knowledge check 2', answer:number|undefined, answerText:string|undefined, correct:boolean|undefined}]}`.
  - **Lab detail:** `{kind:'lab', saved:boolean, answers:object|undefined}`.
  - **`stationTotals(results, topics): Record<topicId, {done:number, total:number, mostMissed:string|null}>`**
    - `mostMissed` is the question label with the most wrong answers.
    - It's `null` when there are no wrong answers.

- [ ] **Step 1: Write the failing tests:**
  - `done equals topicCompleted`: for each lesson topic, use ops that answer every required question correctly and inspect every view. Assert `status === 'done'` and `topicCompleted(topic, state.progress, state.labs) === true`. Assert the same for a valid tn5 lab op taken from `tests/db2/security.test.mjs`'s sandbox helper (`newSandbox`/`runSandbox`).
  - `partial lesson is in progress`: one inspect gives `status 'progress'` and `detail.inspected === 1`.
  - `wrong answers show as incorrect`: a wrong `exercise` gives `questions[0].correct === false` with the chosen option text.
  - `member without progress is new everywhere`: row `{op:null}` gives `status 'new'` for every topic.
  - `unknown station ids are skipped`: `assignedTopics(['tsd','no-such'])` gives `[tsd]`.
  - `totals`: 3 students, 2 done, 1 wrong check gives `{done:2,total:3,mostMissed:'Knowledge check'}`.

- [ ] **Step 2: Run to verify it fails**
  - Run: `node --test frontend/src/features/transposable-elements/tests/stationResults.test.js`
  - Expected: FAIL (module not found).

- [ ] **Step 3: Implement** the three functions:
  - Group rows by `user_id`, replay each user's non-null ops with `replayProgress`, and evaluate each topic.
  - In progress for a lesson means the record has any inspected view or any answer.

- [ ] **Step 4: Run to verify it passes**
  - Run: `npm test`
  - Expected: all pass.

- [ ] **Step 5: Commit**
  - `git add frontend/src/classroom/stationResults.js frontend/src/features/transposable-elements/tests/stationResults.test.js && git commit -m "Add station results for the teacher dashboard"`

### Task 4: Teacher screens — station picker and assignment dashboard

**Files:**
- Create: `frontend/src/classroom/StationPicker.jsx`
- Create: `frontend/src/classroom/StationDashboard.jsx`
- Modify: `frontend/src/classroom/TeacherClasses.jsx`
  - `addAssignment` at about line 54, which inserts the `stations` array.
  - The assignment body at about line 80, which renders the dashboard above `Submissions` when `a.stations.length`, passing `joinCode={cls.join_code}`.
- Modify: `frontend/src/classroom/classroom.css`
- Test: `frontend/src/features/transposable-elements/tests/stationDashboard.test.js` (SSR render via Vite `ssrLoadModule`, like `learningUx.test.js`)

**Interfaces:**
- Consumes: `assignedTopics`, `buildResults`, `stationTotals` (Task 3); `fields`, `modules`, `fieldById` (`curriculum/modules.js`).
- Produces:
  - **`<StationPicker value={string[]} onChange={(ids) => void}/>`**
    - Grouped `fieldset`s (field → module).
    - Checkbox per station, labelled `NN · Title`.
    - Selected stations shown as removable chips in the chosen order.
    - A search box (`aria-label="Search stations"`) filtering by title.
  - **`<StationDashboard client={SupabaseClient} assignment={{id, stations, due_at}} submissions={Array} joinCode={string}/>`**
    - Calls `client.rpc('assignment_station_progress', {p_assignment: assignment.id})`.
    - Renders a `<table>` with one row per student and one column per station (plus File when submissions exist), a Totals row, a Most-missed row, and a Refresh button.
    - A cell is a `<button>` opening the detail panel.

- [ ] **Step 1: Write the failing tests** (render with a fake client whose `rpc` resolves fixture rows):
  - `dashboard lists every student and assigned station`: the header contains `06` and `13`; two student rows appear.
  - `status labels`: `Done`, `Not started` and `1/4 views` appear for the fixture.
  - `headline counts stations only`: `1 of 2 complete`, even when submissions exist.
  - `loading`: before `rpc` resolves, the panel shows `Loading progress…` with `aria-busy="true"`.
  - `empty class`: rows `[]` shows the text `No students yet` and the `joinCode` value.
  - `rpc error`: shows `Couldn’t load progress` and a `Try again` button.

- [ ] **Step 2: Run to verify it fails**
  - Run: `node --test frontend/src/features/transposable-elements/tests/stationDashboard.test.js`
  - Expected: FAIL.

- [ ] **Step 3: Implement the picker and dashboard.**
  - Add `stations: selected` to the insert in `addAssignment`.
  - Use existing `class-*` classes plus new `.station-grid` / `.station-cell` rules in `classroom.css`.
  - Brand tokens only.
  - Cells ≥ 44px tall.
  - The table scrolls horizontally inside its own box on phones.

- [ ] **Step 4: Run to verify it passes**
  - Run: `npm test && npm run lint`
  - Expected: all pass, lint clean.

- [ ] **Step 5: Commit**
  - `git add frontend/src/classroom && git commit -m "Add station picker and teacher assignment dashboard"`

### Task 5: Student assignment card — stations and status

**Files:**
- Modify: `frontend/src/classroom/MyClasses.jsx` (`AssignmentCard`, about line 15)
- Modify: `frontend/src/classroom/classroom.css`
- Test: `frontend/src/features/transposable-elements/tests/stationDashboard.test.js` (add cases)

**Interfaces:**
- Consumes: `assignedTopics` (Task 3); `useProgress` (`features/transposable-elements/useProgress.js`); `stationStatus` and `STATUS_LABEL` (`ui/labData.js`); `journeyStops` (`journey.js`) for each topic's `href`.

- [ ] **Step 1: Write the failing tests:**
  - `student card lists assigned stations with own status and links`: for an assignment with `stations ['tsd']`, the card shows `13 · Target-Site Duplication`, `New`, and a link to `/learn/transposable-elements/tsd`.
  - `privacy line`: it shows exactly `Your teacher can see your progress and answers on these stations.`
  - `file-only assignment`: with `stations []`, there's no station list and no privacy line.

- [ ] **Step 2: Run to verify it fails**
  - Run: `node --test frontend/src/features/transposable-elements/tests/stationDashboard.test.js`
  - Expected: the new cases FAIL.

- [ ] **Step 3: Implement** the station list in `AssignmentCard`, above the existing file upload, which stays unchanged.

- [ ] **Step 4: Run to verify it passes**
  - Run: `npm test && npm run lint && npm run build`
  - Expected: all pass, the build succeeds.

- [ ] **Step 5: Commit**
  - `git commit -am "Show assigned stations on the student assignment card"`

### Task 6: End-to-end check and release

**Files:**
- Modify: `REIMAGINE_INVENTORY.md` (feature map: Classroom row)

- [ ] **Step 1: Run every suite**
  - Run: `npm test && npm run test:db2 && npm run lint && npm run build`
  - Expected: all pass.
- [ ] **Step 2: Browser check (local dev, `preview_start` "frontend")**
  - SSR-render the teacher dashboard and student card with fixtures.
  - Confirm:
    - no console errors;
    - the table scrolls inside its box at 375px;
    - every cell button has an accessible name;
    - WCAG AA contrast on the cells.
  - Real accounts only work on the production origin, so a live round-trip is checked after deploy.
- [ ] **Step 3: Apply the migration to `siaset-staging`.** Use the Supabase connector `apply_migration`, named `assignment_stations`, with the file's SQL. Then confirm `\d public.assignments` shows `stations` and that the function exists. Do this only with the user's go-ahead in that session.
- [ ] **Step 4: Update the inventory, commit and push**
  - `git commit -am "Document assignable stations" && git push`
  - Open a PR to `main`.
