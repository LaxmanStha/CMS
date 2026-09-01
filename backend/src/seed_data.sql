-- Seed live demo data so role dashboards load real DB records.
-- Safe to re-run: uses INSERT OR IGNORE on primary keys.

-- ============================================================
-- Persons (core users)
-- ============================================================
-- Admin
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (1, 'Dr. Sarah Mitchell', 'admin@college.edu', 'Accountant', 'ADM-001');

-- Teacher (login user)
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (2, 'Prof. James Anderson', 'faculty@college.edu', 'Teacher', 'TCH-002');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (11, 'Dr. Robert Chen', 'chen@college.edu', 'Teacher', 'TCH-011');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (12, 'Dr. Lisa Park', 'park@college.edu', 'Teacher', 'TCH-012');

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

-- New seeded students (with login credentials)
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (13, 'Noah Carter', 'noah.carter@college.edu', 'Student', 'STU-013');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (14, 'Sophia Martinez', 'sophia.martinez@college.edu', 'Student', 'STU-014');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (15, 'Ethan Wright', 'ethan.wright@college.edu', 'Student', 'STU-015');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (16, 'Ava Thompson', 'ava.thompson@college.edu', 'Student', 'STU-016');

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
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (13, 'noah.carter@college.edu', 'noah@2026', 'student', 'Noah Carter');
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (14, 'sophia.martinez@college.edu', 'sophia@2026', 'student', 'Sophia Martinez');
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (15, 'ethan.wright@college.edu', 'ethan@2026', 'student', 'Ethan Wright');
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (16, 'ava.thompson@college.edu', 'ava@2026', 'student', 'Ava Thompson');


-- ============================================================
-- Student Profiles
-- ============================================================
INSERT OR IGNORE INTO Student (id, program, year, status)
  VALUES (3, 'CSIT', 2, 'active');
INSERT OR IGNORE INTO Student (id, program, year, status)
  VALUES (5, 'CSIT', 1, 'active');
INSERT OR IGNORE INTO Student (id, program, year, status)
  VALUES (6, 'CSIT', 2, 'active');
INSERT OR IGNORE INTO Student (id, program, year, status)
  VALUES (7, 'BCA', 1, 'active');
INSERT OR IGNORE INTO Student (id, program, year, status)
  VALUES (8, 'BIM', 2, 'active');
INSERT OR IGNORE INTO Student (id, program, year, status, phone, classroom)
  VALUES (13, 'CSIT', 3, 'active', '555-0213', 'MTH-A');
INSERT OR IGNORE INTO Student (id, program, year, status, phone, classroom)
  VALUES (14, 'BCA', 2, 'active', '555-0214', 'BIO-B');
INSERT OR IGNORE INTO Student (id, program, year, status, phone, classroom)
  VALUES (15, 'BCA', 4, 'active', '555-0215', 'CHM-A');
INSERT OR IGNORE INTO Student (id, program, year, status, phone, classroom)
  VALUES (16, 'BIM', 1, 'active', '555-0216', 'HIS-A');

-- ============================================================
-- Teacher Profiles
-- ============================================================
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (2, 'CSIT', '555-0102', 'faculty@college.edu', '2015-08-15', 'active', 'CS-A', 'CS101');
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (11, 'BIM', '555-0111', 'chen@college.edu', '2018-01-10', 'active', 'ENG-A', 'ENG110');
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (12, 'BCA', '555-0112', 'park@college.edu', '2020-09-01', 'active', 'PHY-A', 'PHYS101');

-- ============================================================
-- Classrooms (linked to teachers)
-- ============================================================
INSERT OR IGNORE INTO Classroom (id, room_number, section_name, capacity, teacher_id, status)
  VALUES (1, 'Room 201', 'CS-A', 30, 2, 'active');
INSERT OR IGNORE INTO Classroom (id, room_number, section_name, capacity, teacher_id, status)
  VALUES (2, 'Room 301', 'ENG-A', 30, 11, 'active');
INSERT OR IGNORE INTO Classroom (id, room_number, section_name, capacity, teacher_id, status)
  VALUES (3, 'Room 401', 'PHY-A', 40, 12, 'active');

-- Link students 3, 5, 6 to teacher 2's classroom (CS-A)
INSERT OR IGNORE INTO ClassroomStudent (classroom_id, student_id) VALUES (1, 3);
INSERT OR IGNORE INTO ClassroomStudent (classroom_id, student_id) VALUES (1, 5);
INSERT OR IGNORE INTO ClassroomStudent (classroom_id, student_id) VALUES (1, 6);

-- ============================================================
-- Accountant Profile
-- ============================================================

-- ============================================================
-- Courses
-- ============================================================
INSERT OR IGNORE INTO Course (id, code, name, credits, department, maxCapacity, instructorId, semester, status) VALUES
  (1, 'CS101', 'Introduction to Computer Science', 3, 'CSIT', 60, 2, 'Fall 2024', 'active'),
  (2, 'MATH201', 'Data Structures & Algorithms', 4, 'CSIT', 50, 2, 'Fall 2024', 'active'),
  (3, 'PHYS101', 'Physics I', 3, 'BCA', 40, 12, 'Fall 2024', 'active'),
  (4, 'ENG110', 'English Composition', 3, 'BIM', 30, 11, 'Fall 2024', 'active'),
  (5, 'OOP', 'Object Oriented Programming', 3, 'CSIT', 60, 2, 'Fall 2024', 'active'),
  (6, 'CPROG', 'C Programming', 3, 'CSIT', 60, 2, 'Fall 2024', 'active'),
  (7, 'MICRO', 'Microprocessor Systems', 3, 'CSIT', 50, 2, 'Fall 2024', 'active'),
  (8, 'DBMS', 'Database Management Systems', 3, 'CSIT', 60, 2, 'Fall 2024', 'active'),
  (9, 'OS', 'Operating Systems', 3, 'CSIT', 50, 2, 'Fall 2024', 'active'),
  (10, 'CN', 'Computer Networks', 3, 'CSIT', 60, 2, 'Fall 2024', 'active'),
  (11, 'MATH101', 'Mathematics I', 3, 'BIM', 60, 11, 'Fall 2024', 'active'),
  (12, 'MATH102', 'Mathematics II', 3, 'BIM', 60, 11, 'Fall 2024', 'active'),
  (13, 'STAT', 'Statistics', 3, 'BIM', 60, 11, 'Fall 2024', 'active'),
  (14, 'FM', 'Financial Management', 3, 'BIM', 50, 11, 'Fall 2024', 'active'),
  (15, 'BM', 'Business Management', 3, 'BIM', 50, 11, 'Fall 2024', 'active'),
  (16, 'ECO', 'Economics', 3, 'BIM', 60, 11, 'Fall 2024', 'active'),
  (17, 'CHEM101', 'Chemistry', 3, 'BCA', 40, 12, 'Fall 2024', 'active'),
  (18, 'BIO101', 'Biology', 3, 'BCA', 40, 12, 'Fall 2024', 'active'),
  (19, 'IT', 'Information Technology', 3, 'BCA', 50, 12, 'Fall 2024', 'active'),
  (20, 'WEB', 'Web Development', 3, 'BCA', 50, 12, 'Fall 2024', 'active');


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


-- (Classroom / ClassroomStudent removed: classroom is now a per-teacher
-- string field on Teacher.assignedClassroom and Student.classroom.)

-- A few attendance rows so the roster prefill is visible (idempotent)
INSERT INTO Attendance (studentId, student, course, date, status, time)
  SELECT 3, 'Alex Johnson', 'CS-A', date('now'), 'present', '09:00'
  WHERE NOT EXISTS (SELECT 1 FROM Attendance WHERE studentId='3' AND course='CS-A' AND date=date('now'));
INSERT INTO Attendance (studentId, student, course, date, status, time)
  SELECT 5, 'ram', 'CS-A', date('now'), 'absent', '09:00'
  WHERE NOT EXISTS (SELECT 1 FROM Attendance WHERE studentId='5' AND course='CS-A' AND date=date('now'));
INSERT INTO Attendance (studentId, student, course, date, status, time)
  SELECT 6, 'Emma Davis', 'CS-A', date('now'), 'present', '09:00'
  WHERE NOT EXISTS (SELECT 1 FROM Attendance WHERE studentId='6' AND course='CS-A' AND date=date('now'));

