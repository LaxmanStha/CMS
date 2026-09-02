# Class Connect — Classroom-Scoped Attendance

## Goal
Make it easy for a teacher to take attendance by scoping the UI to **only the students in their own classroom** (a "class connect"), instead of picking from all students. Built on the existing (currently broken) `Classroom` / `ClassroomStudent` backend scaffolding.

## Decisions (confirmed with user)
1. **Link classroom → teacher** by adding `facultyId` to the `Classroom` table (one teacher per class).
2. **Take-attendance UI** = roster grid with bulk submit (one row per student, status toggle, submit all at once).
3. **`Attendance.course`** = teacher-selected course for the session, defaulting to the classroom's `sectionName`.

## Current state (verify before coding)
- `Classroom` + `ClassroomStudent` are referenced by endpoints (`server_main.cpp:1108-1172`) but **never created in `schema.sql`** → tables don't exist at runtime. Must be created.
- `Classroom` has `id, roomNumber, sectionName, capacity, status` — no teacher link.
- `Student.classroom` column exists; `Faculty` has no classroom.
- Self-healing column pattern exists: `alter("ALTER TABLE Student ADD COLUMN classroom TEXT DEFAULT ''");` at `server_main.cpp:308`. Use the same pattern for `Classroom.facultyId`.

## Backend changes (`backend/src`)

### 1. Create tables (idempotent)
In `schema.sql`, add:
```sql
CREATE TABLE IF NOT EXISTS Classroom (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roomNumber TEXT,
  sectionName TEXT,
  capacity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  facultyId INTEGER REFERENCES Faculty(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS ClassroomStudent (
  classroomId INTEGER NOT NULL,
  studentId INTEGER NOT NULL,
  PRIMARY KEY (classroomId, studentId),
  FOREIGN KEY (classroomId) REFERENCES Classroom(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE
);
```

### 2. Self-heal `facultyId` (mirror existing pattern)
Near `server_main.cpp:308` add:
```cpp
alter("ALTER TABLE Classroom ADD COLUMN facultyId INTEGER REFERENCES Faculty(id) ON DELETE SET NULL");
```
Wrap so it only runs when the column is missing (the existing `alter()` helper already no-ops on failure).

### 3. Extend Classroom endpoints
- `POST /api/classrooms`: accept + store `facultyId`.
- `PUT /api/classrooms/{id}`: accept + store `facultyId`.
- `GET /api/classrooms` and `GET /api/classrooms/{id}`: include `facultyId` in output.
- `GET /api/classrooms/{id}/students` (exists): also return each student's `classroom` field for parity.

### 4. New: faculty → classroom lookup
- `GET /api/faculty/{id}/classroom` → returns the `Classroom` row (with `facultyId`) for that teacher, or `null`.

### 5. New: classroom attendance (bulk)
- `GET /api/classroom/{id}/attendance?date=YYYY-MM-DD` → returns existing `Attendance` rows for students in that classroom on that date (prefill the roster). Reuse the existing `LEFT JOIN Student` to also return `classroom`.
- `POST /api/classroom/{id}/attendance` → body `{ course, date, time, records: [{ studentId, student, status, notes }] }`. For each record, `INSERT` (or upsert by `studentId+course+date`) into `Attendance`. Return count inserted.

### 6. Seed demo data (`backend/src/seed_data.sql`)
- Insert one `Classroom` (e.g., `sectionName='CS-A'`, `facultyId=2`).
- Insert `ClassroomStudent` rows linking students 3, 5, 6 to it.
- (Optional) a couple of `Attendance` rows so the roster prefill is visible.

## Frontend changes (`frontend/src`)

### 7. Faculty "Class Connect" roster (`pages/faculty/Attendance.jsx`)
Add a **Class Connect** section above the existing records table:
- On mount: `GET /api/faculty/{user.id}/classroom`. If none, show "No classroom assigned" empty state.
- If classroom exists: load its students via `GET /api/classrooms/{id}/students`.
- Roster grid (new component or inline): one row per student with a status selector (present/absent/late/excused), plus a **date** picker (default today) and a **course** dropdown (options = faculty's courses, default = classroom `sectionName`).
- On "Save Attendance": prefill existing via `GET /api/classroom/{id}/attendance?date=`, then `POST /api/classroom/{id}/attendance` with all rows. Use `useToast` for success/error.
- Keep the existing "Take Attendance" single-record modal as a secondary path; the roster is the primary easy path.

### 8. Reuse existing pieces
- `Select`, `Input`, `Button`, `Card`, `Badge`, `useToast`, `api` — already available.
- The earlier clickable classroom badges (admin/faculty) can remain as a secondary filter on the full records table; reconcile copy so "classroom" = the `Classroom.sectionName` concept.

## Files to touch
- `backend/src/schema.sql` (create tables)
- `backend/src/server_main.cpp` (alter facultyId; extend Classroom CRUD; add `/api/faculty/{id}/classroom`; add classroom attendance GET/POST)
- `backend/src/seed_data.sql` (demo classroom + students)
- `frontend/src/pages/faculty/Attendance.jsx` (Class Connect roster)
- (optional) `frontend/src/components/ui/` new `RosterGrid` if extracted

## Validation
1. Rebuild backend (`g++ ... server_main.cpp ...`) and start server; confirm no "no such table: Classroom" on boot.
2. `GET /api/classrooms` returns the seeded classroom with `facultyId`.
3. Login as faculty (id 2) → open Attendance → Class Connect shows only students 3,5,6.
4. Mark statuses, pick course/date, Save → `GET /api/classroom/{id}/attendance?date=` returns the new rows.
5. Reload page → roster prefills from saved attendance.
6. `npm run build` and `npm run lint` pass on frontend.

## Open questions / risks
- Existing faculty attendance endpoint scopes by **course** (Timetable). We keep it; new classroom flow is additive. Confirm we don't need to retire the old one yet.
- The old clickable-classroom badges filter by `Student.classroom` text, which is independent of the new `Classroom` entity. Decide later whether to unify; out of scope for v1.
- Upsert key for attendance: assume `(studentId, course, date)` unique per day — confirm backend currently allows duplicates or add `INSERT OR REPLACE`/`ON CONFLICT`.
