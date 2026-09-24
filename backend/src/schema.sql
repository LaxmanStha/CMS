-- College Management System schema (idempotent: safe to re-run, keeps existing data)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Person (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  contactInfo TEXT NOT NULL DEFAULT '',
  discriminator TEXT NOT NULL CHECK (discriminator IN ('Student', 'Teacher', 'Accountant')),
  tempId TEXT
);

CREATE TABLE IF NOT EXISTS Student (
  id INTEGER PRIMARY KEY,
  program TEXT,
  year INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  phone TEXT NOT NULL DEFAULT '',
  classroom TEXT DEFAULT '',
  FOREIGN KEY (id) REFERENCES Person(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Teacher (
  id INTEGER PRIMARY KEY,
  department TEXT,
  phone TEXT,
  email TEXT,
  hireDate TEXT,
  status TEXT DEFAULT 'active',
  assignedClassroom TEXT DEFAULT '',
  assignedCourse TEXT DEFAULT '',
  FOREIGN KEY(id) REFERENCES Person(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Course (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL CHECK (credits > 0),
  department TEXT,
  maxCapacity INTEGER NOT NULL CHECK (maxCapacity >= 0),
  instructorId INTEGER,
  semester TEXT,
  status TEXT DEFAULT 'active',
  FOREIGN KEY (instructorId) REFERENCES Teacher(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Department (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Accountant (
  id INTEGER PRIMARY KEY,
  FOREIGN KEY (id) REFERENCES Person(id) ON DELETE CASCADE
);




CREATE TABLE IF NOT EXISTS Attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId TEXT,
  student TEXT,
  course TEXT,
  date TEXT,
  status TEXT DEFAULT 'present',
  time TEXT,
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS Fee (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId TEXT,
  student TEXT,
  course TEXT,
  amount REAL DEFAULT 0,
  paid REAL DEFAULT 0,
  dueDate TEXT,
  paidDate TEXT,
  semester TEXT,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS Timetable (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course TEXT NOT NULL,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  room TEXT,
  instructor TEXT,
  type TEXT DEFAULT 'lecture'
);

-- ---------------------------------------------------------------------------
-- Timetable generator: weekly slot grid, teacher/subject eligibility
-- ---------------------------------------------------------------------------
-- NOTE: `Course.requires_lab` is declared inline in CREATE TABLE Course above.
-- Never re-add it here with `ALTER TABLE ... ADD COLUMN`: initSchema() feeds this
-- whole file to sqlite3_exec() on every boot and throws on the resulting
-- "duplicate column name" error, which stops the server from starting at all.



CREATE TABLE IF NOT EXISTS TimeSlot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL,
  period_number INTEGER NOT NULL CHECK (period_number > 0),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  UNIQUE(day, period_number)
);




CREATE TABLE IF NOT EXISTS TimetableEntries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES Sections(id) ON DELETE CASCADE,
  classroom_id INTEGER REFERENCES Classroom(id) ON DELETE SET NULL,
  slot_id INTEGER NOT NULL REFERENCES TimeSlot(id) ON DELETE CASCADE,
  generation_id INTEGER NOT NULL,
  locked BOOLEAN DEFAULT 0,
  UNIQUE(generation_id, section_id, slot_id)
);

CREATE TABLE IF NOT EXISTS Generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  kind TEXT,
  placed INTEGER,
  total INTEGER
);

-- Lookup paths used by the solver and the post-generation validator.
CREATE INDEX IF NOT EXISTS idx_ttentries_gen ON TimetableEntries(generation_id);
CREATE INDEX IF NOT EXISTS idx_ttentries_gen_slot ON TimetableEntries(generation_id, slot_id);
CREATE INDEX IF NOT EXISTS idx_ttentries_gen_section ON TimetableEntries(generation_id, section_id);
CREATE INDEX IF NOT EXISTS idx_sections_teacher ON Sections(teacher_id);

-- Reference data for the generator: a fixed Mon-Sat x 3-period weekly grid
-- (18 slots, 60 min each, 08:00-11:00).
-- INSERT OR IGNORE + the UNIQUE constraints above make this safe on every boot.
INSERT OR IGNORE INTO TimeSlot (day, period_number, start_time, end_time) VALUES
('Mon', 1, '08:00', '09:00'), ('Mon', 2, '09:00', '10:00'), ('Mon', 3, '10:00', '11:00'),
('Tue', 1, '08:00', '09:00'), ('Tue', 2, '09:00', '10:00'), ('Tue', 3, '10:00', '11:00'),
('Wed', 1, '08:00', '09:00'), ('Wed', 2, '09:00', '10:00'), ('Wed', 3, '10:00', '11:00'),
('Thu', 1, '08:00', '09:00'), ('Thu', 2, '09:00', '10:00'), ('Thu', 3, '10:00', '11:00'),
('Fri', 1, '08:00', '09:00'), ('Fri', 2, '09:00', '10:00'), ('Fri', 3, '10:00', '11:00'),
('Sat', 1, '08:00', '09:00'), ('Sat', 2, '09:00', '10:00'), ('Sat', 3, '10:00', '11:00');



INSERT OR IGNORE INTO Department (id, name) VALUES
  (1, 'BIM'),
  (2, 'CSIT'),
  (3, 'BCA');

CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL
);

-- Classroom assignments used by the admin and student views.
CREATE TABLE IF NOT EXISTS Classroom (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_number TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ClassroomStudent (
  classroom_id INTEGER NOT NULL REFERENCES Classroom(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES Student(id) ON DELETE CASCADE,
  PRIMARY KEY (classroom_id, student_id)
);

CREATE TABLE IF NOT EXISTS TeacherClassroom (
  teacher_id INTEGER NOT NULL REFERENCES Teacher(id) ON DELETE CASCADE,
  classroom_id INTEGER NOT NULL REFERENCES Classroom(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, classroom_id)
);

-- Timetable schedule
CREATE TABLE IF NOT EXISTS TimetableSchedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  classroomname TEXT NOT NULL,
  teacher TEXT NOT NULL,
  period TEXT NOT NULL,
  days TEXT NOT NULL
);
