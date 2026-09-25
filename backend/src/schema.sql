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
  studentId TEXT NOT NULL,
  student TEXT NOT NULL,
  course TEXT NOT NULL,
  classroomId INTEGER,
  teacherId INTEGER,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'present',
  time TEXT,
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE,
  FOREIGN KEY (classroomId) REFERENCES Classroom(id) ON DELETE SET NULL,
  FOREIGN KEY (teacherId) REFERENCES Teacher(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_course_date
  ON Attendance(studentId, course, date);

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
