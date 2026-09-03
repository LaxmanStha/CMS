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


CREATE TABLE IF NOT EXISTS Exam (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  course TEXT NOT NULL,
  date TEXT,
  startTime TEXT,
  endTime TEXT,
  type TEXT DEFAULT 'midterm',
  location TEXT,
  totalMarks REAL DEFAULT 100,
  status TEXT DEFAULT 'scheduled',
  students INTEGER DEFAULT 0
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
-- Timetable generator: rooms, weekly slot grid, teacher/subject eligibility
-- ---------------------------------------------------------------------------
-- NOTE: `Course.requires_lab` is declared inline in CREATE TABLE Course above.
-- Never re-add it here with `ALTER TABLE ... ADD COLUMN`: initSchema() feeds this
-- whole file to sqlite3_exec() on every boot and throws on the resulting
-- "duplicate column name" error, which stops the server from starting at all.

CREATE TABLE IF NOT EXISTS Room (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  is_lab INTEGER NOT NULL DEFAULT 0 CHECK (is_lab IN (0, 1))
);

CREATE TABLE IF NOT EXISTS TimeSlot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL,
  period_number INTEGER NOT NULL CHECK (period_number > 0),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  UNIQUE(day, period_number)
);


CREATE TABLE IF NOT EXISTS Sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  section_label TEXT NOT NULL DEFAULT 'A',
  teacher_id INTEGER REFERENCES Teacher(id) ON DELETE SET NULL,
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

-- Reference data for the generator: a fixed Mon-Sat x 8-period weekly grid
-- (48 slots, 60 min each, 08:00-16:00) plus the default room inventory.
-- INSERT OR IGNORE + the UNIQUE constraints above make this safe on every boot.
INSERT OR IGNORE INTO TimeSlot (day, period_number, start_time, end_time) VALUES
('Mon', 1, '08:00', '09:00'), ('Mon', 2, '09:00', '10:00'), ('Mon', 3, '10:00', '11:00'), ('Mon', 4, '11:00', '12:00'),
('Mon', 5, '12:00', '13:00'), ('Mon', 6, '13:00', '14:00'), ('Mon', 7, '14:00', '15:00'), ('Mon', 8, '15:00', '16:00'),
('Tue', 1, '08:00', '09:00'), ('Tue', 2, '09:00', '10:00'), ('Tue', 3, '10:00', '11:00'), ('Tue', 4, '11:00', '12:00'),
('Tue', 5, '12:00', '13:00'), ('Tue', 6, '13:00', '14:00'), ('Tue', 7, '14:00', '15:00'), ('Tue', 8, '15:00', '16:00'),
('Wed', 1, '08:00', '09:00'), ('Wed', 2, '09:00', '10:00'), ('Wed', 3, '10:00', '11:00'), ('Wed', 4, '11:00', '12:00'),
('Wed', 5, '12:00', '13:00'), ('Wed', 6, '13:00', '14:00'), ('Wed', 7, '14:00', '15:00'), ('Wed', 8, '15:00', '16:00'),
('Thu', 1, '08:00', '09:00'), ('Thu', 2, '09:00', '10:00'), ('Thu', 3, '10:00', '11:00'), ('Thu', 4, '11:00', '12:00'),
('Thu', 5, '12:00', '13:00'), ('Thu', 6, '13:00', '14:00'), ('Thu', 7, '14:00', '15:00'), ('Thu', 8, '15:00', '16:00'),
('Fri', 1, '08:00', '09:00'), ('Fri', 2, '09:00', '10:00'), ('Fri', 3, '10:00', '11:00'), ('Fri', 4, '11:00', '12:00'),
('Fri', 5, '12:00', '13:00'), ('Fri', 6, '13:00', '14:00'), ('Fri', 7, '14:00', '15:00'), ('Fri', 8, '15:00', '16:00'),
('Sat', 1, '08:00', '09:00'), ('Sat', 2, '09:00', '10:00'), ('Sat', 3, '10:00', '11:00'), ('Sat', 4, '11:00', '12:00'),
('Sat', 5, '12:00', '13:00'), ('Sat', 6, '13:00', '14:00'), ('Sat', 7, '14:00', '15:00'), ('Sat', 8, '15:00', '16:00');

INSERT OR IGNORE INTO Room (name, capacity, is_lab) VALUES
('Room 101', 60, 0), ('Room 102', 60, 0), ('Room 103', 60, 0), ('Room 104', 60, 0),
('Room 105', 60, 0), ('Lab A', 30, 1), ('Lab B', 30, 1), ('Lab C', 30, 1);


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
  name TEXT NOT NULL,
  section_name TEXT NOT NULL DEFAULT '',
  capacity INTEGER NOT NULL DEFAULT 0,
  teacher_id INTEGER,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS ClassroomStudent (
  classroom_id INTEGER NOT NULL REFERENCES Classroom(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES Student(id) ON DELETE CASCADE,
  PRIMARY KEY (classroom_id, student_id)
);
