# Timetable Auto-Generation — Implementation Plan

## Context

RapidStrik University CMS needs an automatic timetable generator. The backend
(`backend/src/server_main.cpp`) is a self-contained C++ Crow-less REST server using
Winsock2 + sqlite3, with hand-rolled JSON helpers and a single `handle()` router.
The frontend (`frontend/src/pages/Timetable.jsx`) already has UI for Generate /
Adjust / Conflicts / Lock but the backend endpoints are **stubs** that return fake
messages.

The DB already contains helper tables seeded for this feature (not in `schema.sql`):
- `TimeSlot` (48 rows: Mon–Sat × 8 periods, 08:00–16:00, 1h each)
- `Room` (id, name, capacity, is_lab)
- `TeacherSubjectMap` (faculty_id, course_id)

Current `Timetable` table is free-text (course/day/time/room/instructor/type,
plus `locked`, `timeslot_id`). It will be **replaced** by a normalized
`TimetableEntries` table.

## Confirmed Decisions

| Topic | Decision |
|---|---|
| Section model | New `Sections` table (course + section + teacher + student_count) |
| Teacher max load | Reuse `Faculty.teachingLoad` as max_hours_per_week |
| Weekly sessions | `Course.credits` = weekly_sessions; each session is 60 min (matches TimeSlot grid) |
| Room type rule | Add `Course.requires_lab` (0/1); session needs `Room.is_lab = requires_lab` |
| Timetable storage | Replace `Timetable` with `TimetableEntries` (FKs to Section/Room/TimeSlot) |
| Solver language | C++ in the backend, same binary |
| Sections→Entries FK | `ON DELETE CASCADE` |
| Generation scope | Whole university (all departments) |
| Backtracking timeout | 10 s wall-clock, then partial result + reasons |
| Cross-listing | Not supported (one teacher per section) |
| Migration of old rows | Existing `Timetable` rows become `TimetableEntries` with `locked = 1` |

## 1. Schema Changes (`backend/src/schema.sql` + migration)

Add to `schema.sql` (idempotent `CREATE TABLE IF NOT EXISTS`):

```sql
CREATE TABLE IF NOT EXISTS Sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES Course(id) ON DELETE CASCADE,
  section_label TEXT NOT NULL DEFAULT 'A',
  teacher_id INTEGER REFERENCES Faculty(id) ON DELETE SET NULL,
  student_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(course_id, section_label)
);

CREATE TABLE IF NOT EXISTS TimetableEntries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES Sections(id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES Room(id) ON DELETE SET NULL,
  slot_id INTEGER NOT NULL REFERENCES TimeSlot(id) ON DELETE CASCADE,
  generation_id INTEGER NOT NULL,
  locked BOOLEAN DEFAULT 0,
  UNIQUE(section_id, slot_id)
);

ALTER TABLE Course ADD COLUMN requires_lab INTEGER NOT NULL DEFAULT 0;
```

Drop the old `Timetable` table in the migration step (see §6). Until then keep both
so the running server still serves the grid during incremental rollout.

Add a tiny `Generations` table for metadata/auditing (optional but used by
`/validate/:generation_id` to confirm existence):

```sql
CREATE TABLE IF NOT EXISTS Generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  kind TEXT,            -- 'generate' | 'repair'
  placed INTEGER,
  total INTEGER
);
```

## 2. Validator (write FIRST — §7 of prompt)

Standalone function `validateGeneration(db, generation_id) -> JsonVal` in a new
module `backend/src/timetable_validator.h/.cpp`. It **re-reads raw DB rows** (does
not trust solver bookkeeping) and checks constraints 1–6:

1. Teacher uniqueness — no two entries with same `teacher_id` + same `slot_id`.
2. Room uniqueness — no two entries with same `room_id` + same `slot_id`.
3. Class uniqueness — a `section_id` appears at most once per `slot_id`
   (enforced by UNIQUE too; validator double-checks).
4. Weekly session count — `COUNT(*)` per section == `Course.credits`.
5. Room capacity/type — `Room.capacity >= Sections.student_count` AND
   `(Course.requires_lab = 0 OR Room.is_lab = 1)`.
6. Teacher max load — `SUM(1)` of sessions per teacher <= `Faculty.teachingLoad`.

Returns `{ success, violations: [ {constraint, section_id, detail} ] }`.
Empty `violations` = valid. Exposed at `GET /api/timetable/validate/:generation_id`
and called automatically after every generate/repair before commit.

## 3. CSP Solver (`backend/src/timetable_solver.h/.cpp`)

Pure C++ module, **no Crow/HTTP**. Unit-testable: `solve(input) -> Result`.

**Input model** (loaded from DB by caller):
- `sections`: {id, teacher_id, student_count, credits, requires_lab}
- `rooms`: {id, capacity, is_lab}
- `slots`: 48 TimeSlot ids
- `locked`: map of (section_id, slot_id, room_id) that are fixed
- `deadline`: now + 10s

**Variables**: one per (section, session_index) needing a slot.
A course with `credits=3` → 3 variables for its section.

**Domains**: initial list of `(slot_id, room_id)` pairs satisfying constraint 5
(room capacity & type). Locked entries pre-assign their variable and remove those
slot/room combos from others.

**Heuristics**:
- *Most-constrained variable first*: pick the unscheduled variable with the
  smallest remaining domain (big sections needing labs first).
- *Least-constraining value*: order candidate `(slot,room)` by how few other
  domains it prunes.

**Propagation**: after each assignment run forward-checking — prune domains of
variables sharing teacher / room / section from the chosen slot. If any domain
empties, backtrack immediately.

**Timeout/fallback**: check `std::chrono` deadline in the recursive loop; on
expiry or exhaustive failure return `Result{ assigned, unscheduled: [ {section_id, reason} ] }`.
Reason strings e.g. `"no lab room with capacity >= N free for any teacher slot"`.

Return shape: `{ placed, total_sessions, assignments: [...], unscheduled: [...] }`.

## 4. Incremental Repair (`/repair`)

1. Identify `new_section_ids` from request body.
2. Lock all current entries of *other* sections (`locked=1`) except those directly
   conflicting (same teacher/slot or same room/slot) with a new section.
3. Run solver over only the unlocked variables, treating locked entries as fixed
   constraints.
4. If no solution: progressively unlock lowest-priority (most-recently pinned)
   entries until solvable; record which moved in `changed_assignments`.
Return `{ status:"repair", placed, total, changed_assignments, unscheduled }`.

## 5. API Endpoints (replace stubs in `server_main.cpp`)

All return `{ success, data, error }` envelope. Keep existing `GET /api/timetable`
but change its SQL to JOIN `TimetableEntries → Sections → Course → Room → TimeSlot`
returning flattened `{id, course, day, time, room, instructor, type, locked,
section_id, slot_id, room_id}` for the frontend grid.

New/changed routes:
- `POST /api/timetable/generate` `{ department_id?, force_full_regen? }`
  → build Sections set (whole university unless department_id), create new
  `generation_id`, run solver, write `TimetableEntries`, run validator, return
  `{ generation_id, placed, total_sessions, unscheduled, violations }`.
- `POST /api/timetable/repair` `{ new_section_ids:[int] }` → §4.
- `GET /api/timetable/section/:id` → entries joined with room/slot names.
- `GET /api/timetable/teacher/:id` → weekly schedule for one teacher.
- `GET /api/timetable/room/:id` → weekly schedule + utilization for one room.
- `POST /api/timetable/lock` `{ entry_id:int, locked:bool }` → UPDATE locked flag.
- `GET /api/timetable/validate/:generation_id` → §2 output.
- `POST/PUT/DELETE /api/timetable[/:id]` → manual CRUD writing `TimetableEntries`
  (insert resolves day/time→slot_id, room→room_id, course→section_id via the
  section for that course; new manual entries default `locked=1`).

Compile: add `timetable_solver.cpp` and `timetable_validator.cpp` to the g++
command in `backend/build/bin` (or `#include` the .cpp in `server_main.cpp` to
keep the single-binary build unchanged).

## 6. Migration of Existing Data

One-time SQL/script run before first generate:
1. For each distinct `course` string in old `Timetable`, ensure a `Sections` row
   exists (teacher_id = Course.instructorId, student_count = Course.maxCapacity,
   section_label 'A').
2. For each old row, insert `TimetableEntries` with resolved `section_id`,
   `room_id` (by Room.name), `slot_id` (by day+time match), `generation_id = 0`,
   `locked = 1`.
3. After confirming the new endpoints work, `DROP TABLE Timetable;` (keep it during
   dev to avoid breaking the grid).

## 7. Frontend Adjustments (`frontend/src/pages/Timetable.jsx`)

The component already calls `/generate`, `/adjust`, `/conflicts`, `/lock` and
renders a diff/conflict modal. Align to final shapes:
- `handleGenerate` → expects `{ generation_id, placed, total_sessions, unscheduled }`.
- `handleAdjust` → map to `/repair` call (currently hits stub `/adjust`).
- Diff modal already reads `unfilled_slots[].{class_id,placed,required,reason}`
  and `changed_assignments[].{class_id,timeslot_id,old_teacher_id,new_teacher_id,room}`
  — keep these keys in the C++ responses.
- Grid still reads `course/day/time/room/instructor/type/locked` from the joined
  `GET /api/timetable` (no UI change needed if backend flattens).

## 8. Validation Steps

1. Build: recompile server with solver+validator; start on :8080.
2. Seed: confirm TimeSlot(48)/Room/TeacherSubjectMap present; run migration §6.
3. `POST /api/timetable/generate` → 200, `violations: []`, `placed == total_sessions`.
4. `GET /api/timetable/validate/:generation_id` → empty violations (independent check).
5. Manually lock one entry, `POST /api/timetable/generate` again → locked entry
   unchanged in response diff.
6. `POST /api/timetable/repair` with a new section → only new/conflicting moved.
7. Negative test: set a teacher `teachingLoad=0`, generate → that section in
   `unscheduled` with reason; validator still reports no hard violations for placed.
8. Frontend: load Timetable page, click Generate, confirm grid + diff modal populate.

## 9. Risks / Open Questions

- **Student overlap across sections**: constraint 3 only enforces per-section
  uniqueness, not "a student in two sections can't clash". Out of scope unless
  per-student enrollments into Sections are tracked later.
- **Lab vs lecture mix**: we treat every session of a `requires_lab` course as a
  lab session. If a course needs both, add a per-session flag later.
- **`department_id` filtering**: whole-university is default; department filter is
  optional and only scopes which Sections enter the solver, not the constraints.
- **Build coupling**: keeping the single-binary build means `#include`-ing the two
  new .cpp files in `server_main.cpp` (simplest) or extending the Makefile/g++ line.
