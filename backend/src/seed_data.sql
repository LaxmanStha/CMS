-- Seed live demo data so role dashboards load real DB records.
-- Safe to re-run: uses INSERT OR IGNORE on primary keys.

-- ============================================================
-- Persons (core users)
-- ============================================================
-- Admin
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (1, 'Dr. Sarah Mitchell', 'admin@college.edu', 'Accountant', 'ADM-001');

-- Faculty
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (2, 'Prof. James Anderson', 'faculty@college.edu', 'Faculty', 'FAC-002');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (11, 'Dr. Robert Chen', 'chen@college.edu', 'Faculty', 'FAC-011');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (12, 'Dr. Lisa Park', 'park@college.edu', 'Faculty', 'FAC-012');

-- Student (login user)
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (3, 'Alex Johnson', 'student@college.edu', 'Student', 'STU-003');

-- Additional students for fees/enrollments
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (5, 'ram', 'ram@college.edu', 'Student', 'STU-005');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (6, 'Emma Davis', 'emma@college.edu', 'Student', 'STU-006');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (7, 'Liam Wilson', 'liam@college.edu', 'Student', 'STU-007');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (8, 'Olivia Brown', 'olivia@college.edu', 'Student', 'STU-008');

-- Accountant
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (4, 'Maria Rodriguez', 'accountant@college.edu', 'Accountant', 'ACC-004');

-- ============================================================
-- Users (login credentials)
-- ============================================================
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (1, 'admin@college.edu', 'password123', 'admin', 'Dr. Sarah Mitchell');
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (2, 'faculty@college.edu', 'password123', 'faculty', 'Prof. James Anderson');
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (3, 'student@college.edu', 'password123', 'student', 'Alex Johnson');
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (4, 'accountant@college.edu', 'password123', 'accountant', 'Maria Rodriguez');


-- ============================================================
-- Student Profiles
-- ============================================================
INSERT OR IGNORE INTO Student (id, program, year, status)
  VALUES (3, 'Computer Science', 2, 'active');
INSERT OR IGNORE INTO Student (id, program, year, status)
  VALUES (5, 'Computer Science', 1, 'active');
INSERT OR IGNORE INTO Student (id, program, year, status)
  VALUES (6, 'Computer Science', 2, 'active');
INSERT OR IGNORE INTO Student (id, program, year, status)
  VALUES (7, 'Physics', 1, 'active');
INSERT OR IGNORE INTO Student (id, program, year, status)
  VALUES (8, 'English', 2, 'active');

-- ============================================================
-- Faculty Profiles
-- ============================================================
INSERT OR IGNORE INTO Faculty (id, department, title, email, hireDate, status)
  VALUES (2, 'Computer Science', 'Professor', 'faculty@college.edu', '2015-08-15', 'active');
INSERT OR IGNORE INTO Faculty (id, department, title, email, hireDate, status)
  VALUES (11, 'English', 'Associate Professor', 'chen@college.edu', '2018-01-10', 'active');
INSERT OR IGNORE INTO Faculty (id, department, title, email, hireDate, status)
  VALUES (12, 'Physics', 'Assistant Professor', 'park@college.edu', '2020-09-01', 'active');

-- ============================================================
-- Accountant Profile
-- ============================================================

-- ============================================================
-- Courses
-- ============================================================
INSERT OR IGNORE INTO Course (id, code, name, credits, department, maxCapacity, instructorId, semester, status) VALUES
  (1, 'CS101', 'Introduction to Computer Science', 3, 'Computer Science', 60, 2, 'Fall 2024', 'active'),
  (2, 'MATH201', 'Data Structures & Algorithms', 4, 'Computer Science', 50, 2, 'Fall 2024', 'active'),
  (3, 'PHYS101', 'Physics I', 3, 'Physics', 40, 12, 'Fall 2024', 'active'),
  (4, 'ENG110', 'English Composition', 3, 'English', 30, 11, 'Fall 2024', 'active');


INSERT OR IGNORE INTO Accountant (id) VALUES (4);


-- ============================================================
-- Fee records
-- ============================================================
INSERT OR IGNORE INTO Fee (studentId, student, course, amount, paid, dueDate, paidDate, semester, status)
  VALUES (3, 'Alex Johnson', 'CS101', 1200, 1200, '2026-01-15', '2026-01-10', 'Fall 2024', 'paid');
INSERT OR IGNORE INTO Fee (studentId, student, course, amount, paid, dueDate, semester, status)
  VALUES (3, 'Alex Johnson', 'MATH201', 1200, 600, '2026-08-15', 'Fall 2024', 'partial');
INSERT OR IGNORE INTO Fee (studentId, student, course, amount, paid, dueDate, semester, status)
  VALUES (3, 'Alex Johnson', 'PHYS101', 1200, 0, '2026-08-20', 'Fall 2024', 'pending');
INSERT OR IGNORE INTO Fee (studentId, student, course, amount, paid, dueDate, semester, status)
  VALUES (5, 'ram', 'CS101', 1200, 1200, '2026-01-15', 'Fall 2024', 'paid');
INSERT OR IGNORE INTO Fee (studentId, student, course, amount, paid, dueDate, semester, status)
  VALUES (6, 'Emma Davis', 'MATH201', 1200, 0, '2026-08-18', 'Fall 2024', 'overdue');
INSERT OR IGNORE INTO Fee (studentId, student, course, amount, paid, dueDate, semester, status)
  VALUES (7, 'Liam Wilson', 'PHYS101', 1200, 400, '2026-08-19', 'Fall 2024', 'partial');
INSERT OR IGNORE INTO Fee (studentId, student, course, amount, paid, dueDate, semester, status)
  VALUES (8, 'Olivia Brown', 'ENG110', 1200, 1200, '2026-01-12', 'Fall 2024', 'paid');

-- ============================================================
-- Attendance
-- ============================================================
INSERT OR IGNORE INTO Attendance (studentId, student, course, date, status, time)
  VALUES (3, 'Alex Johnson', 'CS101', date('now','-1 day'), 'present', '09:00');
INSERT OR IGNORE INTO Attendance (studentId, student, course, date, status, time)
  VALUES (3, 'Alex Johnson', 'MATH201', date('now','-1 day'), 'present', '11:00');
INSERT OR IGNORE INTO Attendance (studentId, student, course, date, status, time)
  VALUES (3, 'Alex Johnson', 'PHYS101', date('now','-2 day'), 'absent', '13:00');
INSERT OR IGNORE INTO Attendance (studentId, student, course, date, status, time)
  VALUES (3, 'Alex Johnson', 'CS101', date('now','-2 day'), 'present', '09:00');

-- ============================================================
-- Exams
-- ============================================================
INSERT OR IGNORE INTO Exam (name, course, date, startTime, endTime, type, location, status, students)
  VALUES ('Midterm', 'CS101', date('now','+10 days'), '09:00', '10:30', 'midterm', 'Room 101', 'scheduled', 1);
INSERT OR IGNORE INTO Exam (name, course, date, startTime, endTime, type, location, status, students)
  VALUES ('Quiz 2', 'MATH201', date('now','+12 days'), '11:00', '11:45', 'quiz', 'Room 102', 'scheduled', 1);
INSERT OR IGNORE INTO Exam (name, course, date, startTime, endTime, type, location, status, students)
  VALUES ('Lab Final', 'PHYS101', date('now','+15 days'), '13:00', '15:00', 'final', 'Room 103', 'scheduled', 1);

-- ============================================================
-- Timetable
-- ============================================================
INSERT OR IGNORE INTO Timetable (course, day, time, room, instructor, type)
  VALUES ('CS101', 'Mon', '09:00', 'Room 101', 'Prof. James Anderson', 'lecture');
INSERT OR IGNORE INTO Timetable (course, day, time, room, instructor, type)
  VALUES ('CS101', 'Wed', '09:00', 'Room 101', 'Prof. James Anderson', 'lecture');
INSERT OR IGNORE INTO Timetable (course, day, time, room, instructor, type)
  VALUES ('MATH201', 'Tue', '11:00', 'Room 102', 'Prof. James Anderson', 'lecture');

