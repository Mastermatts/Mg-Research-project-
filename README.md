# Master MG KMTC AI Learning Bot — Scaffold

Your Smart Medical Learning Companion. This is the foundation layer of the
platform: project scaffold, database schema, and authentication. AI Tutor,
Digital Library, Quiz Generator, Telegram bot, and Admin Dashboard build on
top of this in later phases.

## Stack in this scaffold

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS (medical blue / cyan / green theme, dark mode ready)
- Supabase (Postgres + Auth + Storage), via `@supabase/ssr`
- Email/password + Google OAuth login, admission-number signup field
  (Telegram login link is stubbed — wired up when the bot service is built)

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Supabase

1. Create a project at https://supabase.com if you haven't already.
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from
     Project Settings → API.
   - `SUPABASE_SERVICE_ROLE_KEY` — same page. **Never expose this to the
     browser or commit it.**
3. Run the schema migration. Easiest path: open the Supabase SQL Editor and
   paste the contents of `supabase/migrations/0001_init.sql`, then Run.
   (Or, if you use the Supabase CLI: `supabase db push`.)
4. In Authentication → URL Configuration, add
   `http://localhost:3000/api/auth/callback` as a redirect URL (and your
   production URL later).
5. In Authentication → Providers, enable **Google** and paste your Google
   OAuth client ID/secret if you want Google login working.
6. (Optional but recommended) Generate real TypeScript types from your live
   schema — replaces the placeholder in `lib/supabase/database.types.ts`:

   ```bash
   npx supabase login
   npm run db:types
   ```

## 3. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`. Try:

- `/signup` — create an account (name, admission number, department, email,
  password). A matching row is auto-created in `public.profiles` via a DB
  trigger.
- `/login` — email/password or Google.
- `/dashboard` — protected route; redirects to `/login` if not authenticated
  (enforced in `middleware.ts`), shows the signed-in user's profile.

## Research Project: three paths (new)

`/dashboard/research` is a chooser between three entry points, each ending
at the same guided Research Builder:

**Path A — no topic yet** (`/dashboard/research/generate`): Programme
(prefilled from the student's profile) + Research Area + optional
preference tags → AI generates 5 topic cards (title, research area, target
population, study setting, brief explanation, feasibility considerations)
→ SELECT / REFINE / GENERATE MORE on each card → Confirm Topic. The
generator's system prompt (`lib/ai/research.ts`) is explicitly told KMTC
spans many programmes, not just Medical Engineering, and tailors
accordingly.

**Path B — already have a topic** (`/dashboard/research/existing`):
student enters their topic as free text → AI reviews it across all 9
criteria from the spec (grammar, clarity, specificity, scope,
researchability, target population, variables, study setting, feasibility)
→ shows per-criterion feedback plus **one optional suggested rewrite**,
displayed side-by-side with the original. Nothing is ever auto-applied —
the student explicitly picks "Use my original" or "Use suggested version"
(or edits either by hand) before Confirm Topic.

**Path C — already have a document** (`/dashboard/research/document`):
upload a `.docx` or `.pdf` → text extraction (`mammoth` / `pdf-parse`) →
AI analysis proposes corrections tagged by category (grammar, clarity,
structure, citations, **ai_hallucination**, formatting) → Select
Correction Areas (checkboxes, one per category found) → Review Corrections
(AI-hallucination flags shown in a dedicated highlighted section, since
the spec calls that out specifically) → Accept/Reject each → Final Review
(counts of accepted/rejected/unreviewed) → Generate Revised DOCX, which
applies only the accepted corrections and produces a new downloadable
`.docx` (`docx` npm package). Corrections the AI's quoted excerpt can't be
matched verbatim in the source text are skipped rather than guessed at,
and the student is told how many were skipped.

Confirming a topic in Path A or B creates a `research_projects` row and
routes straight into the **Research Builder**
(`/dashboard/research/builder/[id]`) — a one-page-at-a-time guided editor
through the 10 preliminary pages from the spec (Cover Page → Declaration →
Approval → Dedication → Acknowledgement → Abstract → Table of Contents →
List of Tables → List of Figures → List of Abbreviations), each with a
short hint, a progress sidebar, and Save draft / Save & next. The page
list is currently fixed (`lib/research/preliminary-pages.ts`) rather than
admin-configurable like the research profile fields — say if you'd like
the same admin CRUD pattern applied here too.

**Setup:** run `0006_research_builder.sql` after the previous migrations —
it adds `research_projects`, `research_project_pages`, and
`research_documents`, plus a private `research-documents` Storage bucket
for Path C uploads (RLS scoped so each student can only ever see their own
folder).

## Progressive Profile Onboarding (new)

Right after signup, students land on `/onboarding` — a 13-step wizard
instead of one long form. Steps 1–4 (Full Name, Admission Number, Course,
Department) are fixed account fields; **steps 5–13 are admin-configurable**:

| Step | Field | Required |
|---|---|---|
| 1 | Full Name | yes |
| 2 | Admission Number | yes |
| 3 | Course / Programme | yes |
| 4 | Department | yes |
| 5 | Campus | yes |
| 6 | Academic Year | yes |
| 7 | Submission Month | yes |
| 8 | Submission Date | optional — "where required" |
| 9 | Research Topic | yes |
| 10 | Research Area | yes |
| 11 | Lecturer / Supervisor Name | yes |
| 12 | Lecturer / Supervisor Department | yes |
| 13 | Institutional Information | optional — "where required" |

- **Progressive movement:** each confirmed step animates into a compact
  "completed" row stacked above the next active field (`app/onboarding/profile-wizard.tsx`,
  Framer Motion `layout` + `AnimatePresence`), for both the fixed and the
  admin-added steps alike.
- **Intelligent BACK:** BACK steps to the previous field with its saved
  value restored for editing; clicking any completed row above jumps
  straight to that step. Saving from an edited step moves forward again
  without touching any other saved field.
- **Optional steps:** Submission Date and Institutional Information show
  "(optional)" and a "SKIP →" button instead of a required "SAVE & NEXT →"
  when left blank, matching the spec's "where required" fields. Any
  admin-added field can be marked required or optional.
- **Autosave = draft:** every "SAVE & NEXT" persists immediately — core
  fields via `PATCH /api/profile/setup` (writes to `profiles`), research
  fields via `PATCH /api/profile/research-fields` (writes to
  `student_research_profiles`) — alongside a shared `onboarding_step`
  pointer on `profiles`. Reopening `/onboarding` resumes exactly where the
  student left off; "Save as draft & continue later" persists whatever's
  currently typed, even incomplete, and returns to the dashboard.
- **Enforced, not optional:** `middleware.ts` redirects any signed-in user
  with `onboarding_completed = false` away from `/dashboard` into
  `/onboarding`. Once complete, `/dashboard` → "Edit profile" reopens the
  wizard at the last step (`/onboarding?edit=1`) for corrections.

### Admin: add/remove/reorder research profile fields

`/admin/research-fields` (linked from the dashboard for `role = 'admin'`
users) is a CRUD UI over the `research_profile_fields` table — this is what
satisfies "the administrator must be able to add or remove fields depending
on the research template":

- **Add** a field: label, type (short text / long text / dropdown / date),
  options (for dropdowns), placeholder, helper text, required toggle. It's
  appended as the new last step.
- **Reorder** with the ↑/↓ buttons — swaps `sort_order` with the neighbor.
- **Remove** has two modes: the eye icon **deactivates** a field
  (`is_active = false`) — it disappears from the wizard immediately but
  every student's previously-collected answer for it is kept, so it can be
  safely re-enabled later. The trash icon **permanently deletes** it,
  which also cascades and deletes every student's saved answer — the UI
  warns about this before it happens.
- Toggling **Required ↔ Optional** takes effect on the next student who
  reaches that step.

Note on scope: this manages one shared field set applied to every student
("the default research template"). The spec's phrasing ("depending on the
research template") hints at possibly having *multiple* named templates
assigned per department/research type — that's a reasonable next step but
isn't built here; ask if you want it.

**Setup:** run migrations `0004_profile_onboarding.sql` and
`0005_research_profile_fields.sql`, in order, after the earlier ones.
`0005` also seeds the default steps 5–13 field set shown in the table
above. To try the admin UI, set a test user's `role` to `admin` in the
Supabase table editor (same as for library uploads).

Signup (`/signup`) is just email + password — everything else is collected
by the wizard.

### Test/demo data

Use this student for manual QA, never as seeded production data (per the
spec — treat it as demo only):

```
Full Name: John Witidia
Admission Number: DMET/24/001/107
Programme: Medical Engineering
Department: Medical Engineering
Campus: Nairobi
Academic Year: 2024
Submission Month: March
Research Topic: Assessment of Healthcare Workers' Knowledge on the Proper
                Use of Medical Equipment
Supervisor: Example Lecturer
```

## AI Tutor (new)

The AI Medical Tutor is live at `/dashboard/tutor`:

- Streams responses token-by-token from OpenAI (`app/api/ai/chat/route.ts`,
  Server-Sent-Events style over a `POST` fetch stream).
- Persists every conversation to `ai_conversations`/`ai_messages`, and lists
  past conversations in the sidebar.
- Retrieval-augmented: embeds the question and searches `resource_chunks`
  (added in `supabase/migrations/0002_ai_tutor.sql`, pgvector-backed) for
  relevant library content, and asks the model to ground its answer in it
  when relevant. **The library starts empty** — nothing needs to be
  ingested for the tutor to work, it just answers from general medical
  knowledge until resources are chunked+embedded (that ingestion step is
  part of the upcoming Smart PDF Reader / Digital Library phase).
- System prompt (`lib/ai/system-prompt.ts`) is tuned to the spec: clear
  explanations, practical examples, mnemonics on request, and scannable
  revision notes/summaries.
- Free-tier accounts are capped at 30 questions/day (`profiles.subscription_tier`
  gate in the chat route) — matches the "Premium: unlimited AI questions"
  spec item.

**Setup:** run the new migration (`0002_ai_tutor.sql`) in the Supabase SQL
editor after `0001_init.sql`, and make sure `OPENAI_API_KEY` is set in
`.env.local`. No other config needed — `npm run dev` and open
`/dashboard/tutor`.

## Digital Library (new)

Live at `/dashboard/library`:

- Browse/search/filter resources by subject and type (notes, book, slides,
  manual, revision, past paper), with bookmarking.
- Downloads go through `/api/library/resources/[id]/download`, which issues
  a short-lived **signed URL** from the private `resources` Storage bucket
  and increments `downloads_count` — files are never publicly listable.
- **Upload** (visible only to `lecturer`/`admin` roles): staff pick a
  subject, type, optional year/description, and a file. PDFs are
  automatically extracted, chunked, and embedded into `resource_chunks`
  right after upload (`lib/ai/ingest.ts`), so the **AI Tutor's RAG context
  is populated as soon as content is uploaded** — no separate ingestion
  step needed. Non-PDF uploads (slides, docs) are still browsable/downloadable,
  just not yet searchable by the tutor.
- `POST /api/library/resources/[id]` re-runs ingestion for an existing PDF
  (useful if a document was uploaded before this endpoint existed, or a
  chunking pass needs retrying); `DELETE` removes the file + row (staff only).
- Premium-gated resources (`is_premium = true`) are enforced at the RLS
  layer, not just in the UI — a free-tier user's query simply never returns
  them.

**Setup:** run `0003_library_storage.sql` after the previous two
migrations — it creates the private `resources` Storage bucket, its RLS
policies, and the `increment_resource_downloads` RPC. No other config
needed (it reuses your existing `OPENAI_API_KEY` for ingestion).

To try it: log in as a user with `role = 'lecturer'` or `'admin'` in
`profiles` (you'll need to set this manually in the Supabase table editor
for now — the Admin Dashboard to manage roles is a later phase), open
`/dashboard/library`, and upload a PDF. Then ask the AI Tutor a question
covered in that PDF — it should ground its answer in it.

## What's in the database schema

`supabase/migrations/0001_init.sql` creates, with row-level security on every
table:

| Table | Purpose |
|---|---|
| `profiles` | 1:1 with `auth.users`; role (student/lecturer/admin), department, course, admission number, Telegram link, subscription tier, streak, onboarding progress |
| `subjects` | Departments/subjects (Anatomy, Pharmacology, etc.) — seeded from the spec |
| `resources` | Notes, books, slides, manuals, past papers, with full-text search — files live in the `resources` Storage bucket |
| `bookmarks` | User-saved resources |
| `quizzes` / `quiz_questions` / `quiz_attempts` | AI or staff-generated quizzes, scored attempts |
| `flashcards` | AI or staff-generated flashcards |
| `study_plans` | Per-user study schedules |
| `notifications` | Exam reminders, new resources, AI tips |
| `ai_conversations` / `ai_messages` | AI Tutor chat history (also serves as RAG context) |
| `resource_chunks` | pgvector-embedded chunks of library resources, searched by the AI Tutor (`0002_ai_tutor.sql`) |
| `research_profile_fields` | Admin-configurable steps 5–13 of the onboarding wizard (`0005_research_profile_fields.sql`) |
| `student_research_profiles` | Each student's answers to the fields above |
| `subscriptions` | Premium tier tracking |
| `research_projects` | Confirmed research topic + metadata (Paths A/B) |
| `research_project_pages` | The 10 preliminary pages, guided one at a time in the Research Builder |
| `research_documents` | Uploaded documents, AI corrections, and the generated revised DOCX (Path C) |

Roles: `student` (default), `lecturer` (can upload resources/quizzes),
`admin` (full access, matches the Admin Dashboard spec). Premium-gated
resources are only visible to `subscription_tier = 'premium'` users or admins.

## Project layout

```
app/
  page.tsx                 landing page
  (auth)/login/page.tsx    email + Google login
  (auth)/signup/page.tsx   signup (email + password only)
  api/auth/callback/       OAuth code exchange
  onboarding/              13-step progressive profile wizard
  admin/research-fields/   admin CRUD for steps 5–13 of the wizard
  dashboard/page.tsx       protected dashboard shell
  dashboard/tutor/         AI Tutor chat UI
  dashboard/library/       Digital Library browse/upload UI
  dashboard/research/      three-path chooser, Path A/B/C flows, Research Builder
  api/ai/chat/route.ts     streaming AI Tutor endpoint (RAG + OpenAI)
  api/ai/conversations/    list + fetch chat history
  api/library/             subjects, resources (list+upload), download, bookmarks
  api/research/            topics (generate/refine/review), projects+pages, documents (Path C)
  api/profile/             setup (core fields), research-fields (dynamic answers)
  api/admin/research-fields/  admin CRUD endpoints for the field template
lib/supabase/
  client.ts                browser Supabase client
  server.ts                server Supabase client + admin (service role) client
  database.types.ts        generated types (placeholder until you run db:types)
lib/ai/
  openai.ts                OpenAI client + model config
  system-prompt.ts         tutor persona/system prompt
  rag.ts                   embeds queries, searches resource_chunks
  ingest.ts                PDF text extraction, chunking, embedding
  research.ts              topic generation/refinement/review, document analysis
lib/research/
  preliminary-pages.ts     the 10 fixed Research Builder pages
  apply-corrections.ts     applies accepted corrections, builds the revised .docx
lib/auth/
  roles.ts                 role lookup/check helper (student/lecturer/admin)
middleware.ts              session refresh + route protection (/dashboard, /admin, /onboarding)
supabase/migrations/       schema+RLS (0001), pgvector RAG (0002), storage bucket (0003),
                            onboarding tracking (0004), research profile fields (0005),
                            research projects/builder/documents (0006)
```

## Next phases (not in this scaffold)

- **Quiz Generator** — AI-generated `quizzes`/`quiz_questions`, attempt
  scoring UI.
- **Telegram bot** — separate Node/Telegraf service reusing this Supabase
  project and the same AI backend; links via `profiles.telegram_chat_id`.
- **Admin Dashboard** — a proper admin console over `resources`,
  `subjects`, `profiles` (roles, subscriptions), and research projects.
  `/admin/research-fields` exists today for the profile-field template, but
  there's no general admin UI yet for the rest.
- **Research Builder body chapters** — right now the builder only guides
  the 10 preliminary pages; a next step would extend the same pattern to
  the main chapters (Introduction, Literature Review, Methodology, etc.),
  likely with AI drafting assistance per section.
- **Multiple research templates** — `research_profile_fields` and the
  preliminary-pages list currently apply the same template to every
  student; department- or programme-specific templates would build on the
  same admin CRUD pattern.

## Deployment

- Frontend: Vercel — set the same env vars from `.env.example` in Project
  Settings → Environment Variables.
- Telegram bot / any long-running worker: Railway or a small Ubuntu 22.04
  VPS (this scaffold doesn't include the bot service yet).
