# SIASET Learn — Reimagine Inventory (Step 1)

Checklist for the redesign: every row below must have a home in the new UI, and every experiment must keep identical logic, controls, ranges, outputs and saved data.

## 1. Locked palette

Source: `frontend/src/theme.css` (brand), matches the logo SVGs.

| Token | Hex | Current role |
|---|---|---|
| brand-primary | `#10283F` | Navy: sidebar, headings, body text |
| brand-secondary | `#176D80` | Teal: actions, eyebrows, selected states |
| brand-accent | `#68D9D1` | Aqua: active nav on dark, focus on dark, selection |
| brand-highlight | `#F5B75E` | Amber: hero CTA, warning accent |
| page-background | `#F5F8FC` | Page |
| surface / subtle / selected | `#FFFFFF` / `#EAF2F6` / `#E1F4F2` | Cards, quiet fills, selected fills |
| text / secondary / muted | `#10283F` / `#465E70` / `#526B7C` | Text ramp |
| border | `#CBD9E2` | Lines |
| link / action-hover / focus | `#145F70` / `#115365` / `#0C657B` | Teal shades |
| success / bg | `#166653` / `#E7F5EF` | Status |
| warning / bg | `#805214` / `#FFF3DC` | Status |
| error / bg | `#9B3440` / `#FFF0F0` | Status |
| disabled / bg | `#607384` / `#E4EBEF` | Disabled |
| nav-text | `#C6DBE5` | Text on navy |
| molecular bg / text / muted | `#0E1419` / `#DFE8EC` / `#A8BAC3` | Dark diagram surfaces |

**Scientific category colours** (`frontend/src/scientific.css`) — part of the experiment outputs, kept as-is inside diagrams:
donor `#66B7B0`, target `#6D9ED0`, element `#D3B775`, TSD `#C79CDA`, res `#EB936D`, TIR `#F2DA99`, gene `#8EA1A9`.

**Ambiguity:** the current UI CSS also hard-codes many hues that are in neither set (sage/olive greens such as `#6F9A55`, `#3F6A2E`, `#2E765B`; peach `#FF9F7A`; cream `#FFFEFA`; lilac `#E4C8F0` …), e.g. the Learning Compass and the story/parts bench CSS. Proposed rule: treat them as drift and replace them with brand tints/shades, except inside experiment SVGs where they encode meaning.

## 2. Logo

`frontend/public/branding/` (SVG, rendered by `src/Brand.jsx`):
- `siaset-logo-full-{light,dark}.svg` (780×190)
- `siaset-logo-compact-{light,dark}.svg` (360×104)
- `siaset-monogram-{light,dark}.svg` (256×256), `favicon.svg`

Use these files unchanged. `branding.test.js` guards them.

## 3. Features and pages

| Route | Feature |
|---|---|
| `/` | Overview: next-topic CTA, Learning Compass (x/18), course facts, modules → chapters, method, destinations |
| `/learn/transposable-elements` | Curriculum: search (title/objectives/terms), filter (all / lessons / labs), module + chapter sections, persistence status, hash deep-links (`#module-*`, `#journey-*`) |
| `/learn/{module}/:topicId` | Lesson page: objectives, concept, terms, interactive activity, Explore views, applied-reasoning + knowledge checks, completion summary, prev/next, reset lesson, model notes + references |
| Topic workspace bar | All topics link, module position, completion state, jump-to-topic select, prev/next arrows |
| `/lab/transposable-elements?experiment=tn5\|tn3` | Guided labs (see 4) |
| `/lab/transposable-elements/sandbox` | Free sandbox (see 4) |
| `/learn/transposable-elements/assessment[?module=]` | Cumulative / per-module assessment |
| `/learn/transposable-elements/progress` | Progress dashboard |
| `/account`, `/auth/callback`, `/auth/recovery` | Sign in / sign up / recovery, password strength, profile editor, avatar upload |
| Sidebar | Grouped nav (Learn, Experiment, Reflect, Classroom), account card, collapse, mobile menu, sync status (off / syncing / synced / error) |
| `/classes` | Student: join class, assignments |
| `/play`, `/play/:sessionId` | Student live quiz |
| `/teach`, `/teach/approve` | Teacher request + approval, class management, assignments, quiz authoring |
| `/teach/live/:sessionId` | Live quiz host |
| Global | Skip link, route titles + focus management, scroll restoration, 404 page, lazy route loading state |

## 4. Interactive experiments (logic is locked)

| # | Topic | Component (UI) | Logic file(s) | Controls | Outputs |
|---|---|---|---|---|---|
| 1 | Introduction | `MobilityGates mode="intro"` | `mobilityGates.js` | buttons, checkbox | gate states, mobility verdict |
| 2 | History & Discovery | `KernelGrower` | `kernelModel.js` | Ac toggle (checkbox), timing slider 0–1 step 0.05, buttons | kernel spotting pattern |
| 3 | Anatomy | `AnatomyLab` | `anatomyLab.js` | 9 buttons (part selection) | annotated element, verdicts |
| 4 | Classification | `ClassificationSort` | `classificationSort.js` | sort buttons | class buckets, feedback |
| 5 | DNA Transposons | `CopyLedger` | `copyLedger.js` | buttons | copy-number ledger; Tn5/Tn3 launch links |
| 6 | Conservative (Tn5) | `Laboratory` | `engine/tn5.js`, `engine/model.js`, `learning.js`, `guidedStages.js` | stage steps, prediction checkpoint, calculate, undo/redo, reset, replay, compare toggle, SVG feature inspection | molecule SVGs, metrics, stage strip, inspector, timeline, 9 bp TSD, evidence + references |
| 7 | Replicative (Tn3) | `Laboratory` | `engine/tn3.js`, `learning.js` | same as Tn5 + TnpR enable/disable gate, two checkpoints | cointegrate, res sites, resolution, catenation warning |
| 8 | Insertion Sequences | `MobileElementBuilder` | `mobileElementBuilder.js` | part buttons | built IS element, validity |
| 9 | Composite | `CompositeBuilder` | `compositeBuilder.js` | 8 buttons | composite structure, validity |
| 10 | Genomic Consequences | `RecombinationLab` + `ConsequenceExplorer` | `recombinationLab.js`, `engine/consequences.js` | buttons, checkbox | recombination products |
| 11 | Phenotypes | `PhenotypeExplorer` | `phenotypeChain.js` | buttons | phenotype chain |
| 12 | Expression | `OperonExplorer` | `operonModel.js` | 3 checkboxes, buttons | operon expression readout |
| 13 | TSD | `TsdBuilder` | `tsdJourney.js` | stagger slider (`STAGGER_RANGE`), cut slider 2…HOST_LENGTH−stagger−2, buttons | duplicated target site |
| 14 | Regulation | `MobilityGates` | `mobilityGates.js` | buttons, checkbox | gate states |
| 15 | Bacterial HGT | `HgtLab` + `BacterialExplorer` | `hgtLab.js`, `engine/bacterial.js` | buttons, 2 checkboxes | transfer outcome |
| 16 | DNA Extraction | `ReagentStages` | `dnaExtraction.js` | 3 buttons | reagent stage states |
| 17 | Isopropanol Precipitation | `ProtocolBench kind="precipitation"` | `dnaExtraction.js` | buttons, checkbox | protocol result |
| 18 | Ethanol Wash | `ProtocolBench kind="wash"` | `dnaExtraction.js` | buttons, checkbox | protocol result |
| S | Sandbox | `Sandbox` + `StoryScenes` | `freeBench.js`, `sandboxSession.js`, engines | Tn5/Tn3 switch, target-site slider 0–359, free tools | scene, investigations x/N, experiment notebook (session only) |
| — | Every lesson | `Exploration` / `Question` | `lessons.js`, `lessonProgress.js` | view tabs, radio questions | inspected views, verdicts |
| — | Assessment | `Assessment` | `assessment.js`, `tests/assessment-v1.json` | radio questions | score |

**Saved data:** lesson evidence (inspected, exercise, check, check2), lab completion, assessment — `progressRepository.js` (local storage) synced through `progressSync.js` to Supabase when signed in. Keys and shapes stay unchanged.

## 5. Design check (Lab bench direction)

Prototype: https://claude.ai/artifact/YBRo3cVE9BiFXm2VbeXKVS (private until shared).

- [x] Palette: scan of all artboards finds only `theme.css` tokens, one navy tint `#23394E`, navy shadows, and scientific colours inside the experiment canvas.
- [x] Logo: original `siaset-logo-compact-{dark,light}.svg` and `siaset-monogram-dark.svg`, uploaded unchanged.
- [x] Every feature in section 3 has a screen (mapping below).
- [ ] Experiments: the prototype shows only Tn5 in detail. The other 19 keep their components and logic as-is, inside the same station layout. This gets checked during implementation.

| Feature | New home |
|---|---|
| Public entry (new) | Landing page at `/`: hero, how a station works, benches, station preview, teachers, honesty notes. Signed out: Enter the lab (guest) + Sign in / Create account. Signed in: resume card + Go to lab room. Lab room moves to its own route (e.g. `/lab`) |
| Overview, next topic, course facts | Lab room: welcome card, "Resume station", bench progress |
| Curriculum modules → chapters → topics | Lab room: benches → shelves → station cards |
| Curriculum search + filter, hash deep-links | Station finder (search, bench and type filters, empty state) |
| Lesson page + topic workspace bar | Station page: challenge banner, guided steps, canvas, tool tray, results tabs; prev/next + jump select move into the header |
| Guided labs Tn5/Tn3 + switcher | Station page (Tn5/Tn3 toggle in header); mobile bottom sheet |
| Sandbox | "Free bench" card + Station header link |
| Completion summary, prev/next, reset | Results & reflect; reset stays on the station |
| Assessment (cumulative + per module) | Practice (nav), Results page |
| Progress dashboard | Notebook: bench progress by chapter, badges, recent entries |
| Account, profile, avatar, password, sync status | Notebook profile card; avatar + sync dot in header; signed-out state |
| Classes, assignments, live quiz (play) | Classroom → "I'm a learner" |
| Teach, approval, classes, quizzes, live host | Classroom → "I teach" |
| Assignable stations + teacher dashboard (new) | Classroom → assignment form station picker; each assignment opens a students × stations dashboard; students see assigned stations on their card |
| Loading, 404, save/sync errors | States board |

New engagement layers: challenge banner, predict-first gating (already in the lab), streak, chapter badges, next-station suggestion, onboarding tour, and an "Explain it back" note. Streak, badges and the note are new derived or stored data that need a decision before implementation. The note needs new storage; streak and badges can be derived from existing evidence.

## 6. Multi-field lab (structure for every screen)

SIASET is presented as one virtual lab across fields, not a Transposable Elements site.

**Hierarchy:** Field → Module → Chapter → Station.

| Field (placeholder names, rename freely) | Module | Stations |
|---|---|---|
| Genetics | Transposable Elements | 01–15 |
| Molecular Biology | DNA Extraction & Purification | 16–18 |
| [Next field] | added later | — |

**What changed in the design:**
- **Landing:** "One lab, many fields" hero; a Fields section (field → module cards plus a "next field" placeholder); field-neutral footer.
- **Lab room:** field tabs with counts; a field chip on each module; a "next field" card.
- **Station finder:** filter by field; results show Field › Module.
- **Station:** the breadcrumb shows Field › Module › Chapter.
- **Notebook:** progress per field, then by chapter.
- **Practice:** one assessment per module, grouped by field.
- **Classroom:** assign stations from any field.

**Logo note:** the full logo's tagline reads "Transposable Elements Virtual Laboratory", and logo files are locked, so field-neutral screens use the compact logo. A neutral full lockup needs a brand decision.

**Code implications for Step 6:**
- Add a `fields` registry and a `field` key on each module in `curriculum/modules.js`.
- Topic ids and saved progress keys stay unchanged.
- Routes are still rooted at `/learn/transposable-elements` for curriculum, assessment and progress. They need neutral paths (e.g. `/lab`, `/practice`, `/notebook`) with redirects from the old ones.

## 7. Implementation (Step 6)

**Routes**

| Route | Page |
|---|---|
| `/` | Landing (new) |
| `/lab` | Lab room (new) |
| `/stations` | Station finder (also `/learn/transposable-elements`) |
| `/practice` | Assessments (also `/learn/transposable-elements/assessment`) |
| `/notebook` | Progress (also `/learn/transposable-elements/progress`) |

All old routes, hash deep links and `?experiment=` links still work. `/learn/dna-extraction` now redirects to `/lab#module-dna-extraction`.

**New components**
- `ui/Landing.jsx`: helix, live teaser, fields, teachers.
- `ui/LabRoom.jsx`: field tabs, module/chapter shelves, first-visit tour.
- `ui/labData.js`: read-only station status, chapter badges, field summaries.
- `curriculum/stations.js`: challenge copy only.
- `ui/lab-shell.css`: new look; brand tokens restored on lab pages.

**Rebuilt shell:**
- `ui/WorkspaceSidebar.jsx` is now the top navigation.
- `ui/WorkspaceShell.jsx` and `ui/TopicWorkspace.jsx` were rebuilt; the latter adds the challenge banner and the Field › Module › Chapter path.
- `ui/CurriculumOverview.jsx` is now the Station finder.

**Removed:** `ui/LearningOverview.jsx` (its content moved to the Lab room) and `ui/sidebar.css`.

**Experiments are wrapped, not rewritten.** Unchanged:
- `engine/*`, `learning.js`, `guidedStages.js`, `storyLab.js`.
- Every `components/*.jsx`.
- `Laboratory.jsx`, `Sandbox.jsx`, `Lessons.jsx`, `Assessment.jsx`.
- `partsBench.css`, `tsdBuilder.css`, `storyLab.css`, `concept-diagram.css`, `diagram-review.css`, `scientific.css`.

The three-column station layout (steps | bench | tool tray) is CSS grid over the lab's existing markup.

**Colours**
- UI stylesheets were swept to brand tokens.
- Colours still outside the palette are experiment visuals (gate states, colonies, DNA parts, scenes, dark molecule cards) and the scientific palette. These are deliberately left with the experiments.

**Not built (each needs a data decision):**
- Streak: lessons store no dates.
- "Explain it back" note: would need new storage.

**Fixed (db2 contract):** the server contract is now `siaset-v2`. It covers all 16 lessons (71 views) and is registered by migration `20261124120000_contract_v2.sql`; `siaset-v1` stays for operations already recorded under it. `npm run test:db2` passes 36/36.
