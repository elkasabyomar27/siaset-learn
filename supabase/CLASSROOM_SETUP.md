# SIASET classroom: teachers, classes, assignments and live quizzes

Added 10 November 2026. Nothing here has been applied to a hosted project yet.

## What it does

| Page | Who | What |
|------|-----|------|
| `/teach` | signed-in users | Request teacher access. Once approved: create classes (6-letter join code), post assignments, download and grade submissions, build quizzes and host them live. |
| `/teach/approve` | site owner, from the email | Review a teacher request and approve or decline it. The one-time link is the permission; no sign-in needed. |
| `/teach/live/:id` | the hosting teacher | Classroom-screen view: PIN, lobby, questions with a timer, answer tallies, leaderboard, podium. |
| `/classes` | students | Join a class with its code, read assignments, hand in a file (resubmitting clears the grade), see grade and feedback. |
| `/play` | students | Enter the game PIN and a nickname, answer on a phone, see points and rank. |

### Becoming a teacher

1. A signed-in user fills in school and reason on `/teach`.
2. The `teacher-request` Edge Function stores a pending request and emails `TEACHER_ADMIN_EMAIL` a link with a random one-time token. Only its SHA-256 hash is stored, and only the newest link works.
3. The owner opens the link and approves or declines. The requester is emailed the outcome. Re-requests are limited to one email per 10 minutes, and declined users wait 24 hours.

Browsers can never write `teacher_requests.status`. Only the function (service role) can.

### Security rules (enforced in the database, tested in `tests/db2/classroom.test.mjs`)

- Only signed-in, non-anonymous accounts take part. Signed-out visitors can't reach any classroom table or function.
- Teachers see only their own classes, rosters, submissions, quizzes and games. Students see their own classes, assignments and submissions. Classmates can't see each other.
- Students can write only the file fields of their own submission. Grades and feedback go through `grade_submission()`, which checks the caller teaches the class.
- Files go in the private `class-submissions` bucket at `{class}/{assignment}/{student}/{file}`, 25 MB max, with document and image types only. Students can upload to and delete only their own folder, and only in classes they belong to. Teachers can read their classes' folders.
- Quiz answers never reach students before the reveal. The session row holds only the current question's text, options and timer. Scoring happens in `quiz_answer()`: 500–1000 points for a correct answer (faster scores more), 0 for wrong. Late, repeated and out-of-range answers are refused.
- `quiz_advance()` acts only if the game is still in the step the host's screen shows, so double clicks or a timer racing the button can't skip a question.

## Turning it on (staging first)

1. **Database:** apply `migrations/20261110120000_classroom.sql` to the project (`supabase db push`, or through the Supabase connector). It adds tables, functions, storage policies and the `class-submissions` bucket, and adds the quiz tables to the `supabase_realtime` publication.
2. **Email:** create a [Resend](https://resend.com) account and API key. Until you verify a sending domain, Resend can only send from `onboarding@resend.dev` to your own Resend account address. That is enough for approval emails to you, but the "you're approved" email to teachers needs a verified domain.
3. **Function secrets:**
   ```
   supabase secrets set RESEND_API_KEY=… TEACHER_ADMIN_EMAIL=<your email> \
     TEACHER_EMAIL_FROM="SIASET <onboarding@resend.dev>" \
     SIASET_APP_ORIGIN=https://siaset-learn.vercel.app
   ```
   Optional: `SIASET_ALLOWED_ORIGINS` lists the browser origins that may call the function, separated by commas. It defaults to `SIASET_APP_ORIGIN`. Add `http://localhost:5173` to it to test teacher requests from a local dev server.
4. **Deploy the function:** `supabase functions deploy teacher-request`. `config.toml` already sets `verify_jwt = false`, and the handler verifies the signed-in user itself.
5. Sign in, request teacher access on `/teach`, and approve yourself from the email.

Until step 1 is done, the classroom pages say the classroom isn't set up yet. Until steps 2–4 are done, a teacher request shows "Teacher requests are not set up on this site yet."

## Known limits

- Deleting a class or assignment removes its database rows, but files already uploaded stay in the bucket. Clean up old folders in the Storage dashboard.
- A game is not tied to a class: anyone signed in who has the PIN can join, as in Kahoot. Each host has one live game at a time, and starting a new one ends the previous one.
- The question timer runs on each device's clock from the server start time. A badly wrong phone clock shows a slightly wrong countdown, but the server still decides whether an answer was in time.
