-- College Management System schema (idempotent: safe to re-run, keeps existing data)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Person (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  contactInfo TEXT NOT NULL DEFAULT '',
  discriminator TEXT NOT NULL CHECK (discriminator IN ('Student', 'Faculty', 'Accountant')),
  tempId TEXT
);

CREATE TABLE IF NOT EXISTS Student (
  id INTEGER PRIMARY KEY,
  gpa REAL NOT NULL CHECK (gpa >= 0.0 AND gpa <= 4.0),
  cgpa REAL NOT NULL CHECK (cgpa >= 0.0 AND cgpa <= 4.0),
  program TEXT,
  year INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  advisor TEXT,
  FOREIGN KEY (id) REFERENCES Person(id) ON DELETE CASCADE
);

ALTER TABLE Student ADD COLUMN advisor TEXT;

CREATE TABLE IF NOT EXISTS Faculty (
  id INTEGER PRIMARY KEY,
  teachingLoad INTEGER NOT NULL CHECK (teachingLoad >= 0),
  department TEXT,
  title TEXT,
  email TEXT,
  hireDate TEXT,
  status TEXT DEFAULT 'active',
  FOREIGN KEY (id) REFERENCES Person(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Accountant (
  id INTEGER PRIMARY KEY,
  FOREIGN KEY (id) REFERENCES Person(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Course (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL CHECK (credits > 0),
  department TEXT,
  maxCapacity INTEGER NOT NULL CHECK (maxCapacity >= 0),
  instructorId INTEGER,
  currentEnrollment INTEGER NOT NULL DEFAULT 0 CHECK (currentEnrollment >= 0),
  semester TEXT,
  status TEXT DEFAULT 'active',
  FOREIGN KEY (instructorId) REFERENCES Faculty(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Prerequisite (
  courseId INTEGER NOT NULL,
  prerequisiteId INTEGER NOT NULL,
  PRIMARY KEY (courseId, prerequisiteId),
  FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE,
  FOREIGN KEY (prerequisiteId) REFERENCES Course(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Enrollment (
  studentId INTEGER NOT NULL,
  courseId INTEGER NOT NULL,
  enrollmentDate DATE DEFAULT (date('now')),
  grade REAL,
  status TEXT DEFAULT 'enrolled',
  PRIMARY KEY (studentId, courseId),
  FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL
);
