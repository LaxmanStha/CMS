-- One-time migration: widen TimetableEntries uniqueness to include generation_id.
--
-- Why: the original UNIQUE(section_id, slot_id) spans every generation, so the
-- second /generate run would fail on any reused (section, slot) pair.
--
-- Safety: nothing in server_main.cpp has ever written to TimetableEntries (the
-- generator is unimplemented), so this table is expected to be empty. Confirm
-- before running:
--     SELECT COUNT(*) FROM TimetableEntries;   -- expect 0
-- The migration copies any rows across anyway, but a non-zero count means you
-- should check for pre-existing duplicates first.
--
-- Run from the directory holding college.db:
--     sqlite3 college.db ".read ../../src/migrate_timetable_entries.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

ALTER TABLE TimetableEntries RENAME TO TimetableEntries_old;

CREATE TABLE TimetableEntries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES Sections(id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES Room(id) ON DELETE SET NULL,
  slot_id INTEGER NOT NULL REFERENCES TimeSlot(id) ON DELETE CASCADE,
  generation_id INTEGER NOT NULL,
  locked BOOLEAN DEFAULT 0,
  UNIQUE(generation_id, section_id, slot_id)
);

INSERT INTO TimetableEntries (id, section_id, room_id, slot_id, generation_id, locked)
  SELECT id, section_id, room_id, slot_id, generation_id, locked FROM TimetableEntries_old;

DROP TABLE TimetableEntries_old;

CREATE INDEX IF NOT EXISTS idx_ttentries_gen ON TimetableEntries(generation_id);
CREATE INDEX IF NOT EXISTS idx_ttentries_gen_slot ON TimetableEntries(generation_id, slot_id);
CREATE INDEX IF NOT EXISTS idx_ttentries_gen_section ON TimetableEntries(generation_id, section_id);

COMMIT;
PRAGMA foreign_keys = ON;