-- Seed live demo data so role dashboards load real DB records.
-- Safe to re-run: uses INSERT OR IGNORE on primary keys.

-- ============================================================
-- Persons (core users)
-- ============================================================
-- Admin
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (1, 'Ratish Humagain', 'admin@college.edu', 'Accountant', 'ADM-001');

-- Teacher (login user)
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (2, 'Prof. James Anderson', 'faculty@college.edu', 'Teacher', 'TCH-002');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (11, 'Dr. Robert Chen', 'chen@college.edu', 'Teacher', 'TCH-011');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (12, 'Dr. Lisa Park', 'park@college.edu', 'Teacher', 'TCH-012');
-- Additional teachers
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (21, 'Dr. Sarah Williams', 'williams@college.edu', 'Teacher', 'TCH-021');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (22, 'Prof. Michael Brown', 'brown@college.edu', 'Teacher', 'TCH-022');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (23, 'Dr. Jennifer Davis', 'davis@college.edu', 'Teacher', 'TCH-023');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (24, 'Prof. David Miller', 'miller@college.edu', 'Teacher', 'TCH-024');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (25, 'Dr. Amanda Wilson', 'wilson@college.edu', 'Teacher', 'TCH-025');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (50, 'Dr. Priya Sharma', 'priya.sharma@college.edu', 'Teacher', 'TCH-050');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (51, 'Prof. Daniel Lee', 'daniel.lee@college.edu', 'Teacher', 'TCH-051');
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (52, 'Dr. Grace Thompson', 'grace.thompson@college.edu', 'Teacher', 'TCH-052');

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

-- ============================================================
-- 5 Random seed entries for testing
-- ============================================================
-- Random Person (Student)
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (17, 'Mia Chen', 'mia.chen@college.edu', 'Student', 'STU-017');

-- Random Person (Teacher)
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (18, 'Dr. Aaron Kim', 'aaron.kim@college.edu', 'Teacher', 'TCH-018');

-- Random Student Profile
INSERT OR IGNORE INTO Student (id, program, year, status, phone, classroom)
  VALUES (17, 'CSIT', 3, 'active', '555-0217', 'CS-A');

-- Random Teacher Profile
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (18, 'CSIT', '555-0118', 'aaron.kim@college.edu', '2023-01-15', 'active', 'Room 202', 'AI201');

-- Random Course
INSERT OR IGNORE INTO Course (id, code, name, credits, department, maxCapacity, instructorId, semester, status)
  VALUES (21, 'AI201', 'Artificial Intelligence Fundamentals', 3, 'CSIT', 40, 18, 'Fall 2024', 'active');

-- Random Section
INSERT OR IGNORE INTO Sections (id, course_id, section_label, teacher_id, student_count)
  VALUES (21, 21, 'A', 18, 35);

-- Random Fee Record
INSERT OR IGNORE INTO Fee (studentId, student, course, amount, paid, dueDate, paidDate, semester, status)
  VALUES (17, 'Mia Chen', 'AI201', 1200, 600, '2026-09-15', '2026-09-10', 'Fall 2024', 'partial');

-- Random Exam
INSERT OR IGNORE INTO Exam (name, course, date, startTime, endTime, type, location, status, students)
  VALUES ('Midterm', 'AI201', date('now','+7 days'), '10:00', '11:30', 'midterm', 'Room 202', 'scheduled', 1);

-- Accountant
INSERT OR IGNORE INTO Person (id, name, contactInfo, discriminator, tempId)
  VALUES (4, 'Maria Rodriguez', 'accountant@college.edu', 'Accountant', 'ACC-004');

-- ============================================================
-- Users (login credentials)
-- ============================================================
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (1, 'admin@college.edu', 'password123', 'admin', 'Ratish Humagain');
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
-- Additional teachers login
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (21, 'williams@college.edu', 'password123', 'faculty', 'Dr. Sarah Williams');
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (22, 'brown@college.edu', 'password123', 'faculty', 'Prof. Michael Brown');
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (23, 'davis@college.edu', 'password123', 'faculty', 'Dr. Jennifer Davis');
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (24, 'miller@college.edu', 'password123', 'faculty', 'Prof. David Miller');
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (25, 'wilson@college.edu', 'password123', 'faculty', 'Dr. Amanda Wilson');
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (50, 'priya.sharma@college.edu', 'password123', 'faculty', 'Dr. Priya Sharma');
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (51, 'daniel.lee@college.edu', 'password123', 'faculty', 'Prof. Daniel Lee');
INSERT OR IGNORE INTO Users (id, email, password, role, name)
  VALUES (52, 'grace.thompson@college.edu', 'password123', 'faculty', 'Dr. Grace Thompson');


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
  VALUES (2, 'CSIT', '555-0102', 'faculty@college.edu', '2015-08-15', 'active', 'Room 201', 'CS101');
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (11, 'BIM', '555-0111', 'chen@college.edu', '2018-01-10', 'active', 'Room 301', 'ENG110');
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (12, 'BCA', '555-0112', 'park@college.edu', '2020-09-01', 'active', 'Room 401', 'PHYS101');
-- Additional teachers
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (21, 'CSIT', '555-0121', 'williams@college.edu', '2019-03-15', 'active', 'Room 501', 'CS201');
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (22, 'BCA', '555-0122', 'brown@college.edu', '2021-07-01', 'active', 'Room 502', 'MATH101');
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (23, 'BIM', '555-0123', 'davis@college.edu', '2020-01-20', 'active', 'Room 503', 'BUS201');
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (24, 'CSIT', '555-0124', 'miller@college.edu', '2022-09-10', 'active', 'Room 504', 'CS301');
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (25, 'BCA', '555-0125', 'wilson@college.edu', '2023-02-28', 'active', 'Room 505', 'STAT101');
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (50, 'CSIT', '555-0150', 'priya.sharma@college.edu', '2021-08-16', 'active', 'Room 506', 'CS201');
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (51, 'BCA', '555-0151', 'daniel.lee@college.edu', '2020-01-20', 'active', 'Room 507', 'MATH101');
INSERT OR IGNORE INTO Teacher (id, department, phone, email, hireDate, status, assignedClassroom, assignedCourse)
  VALUES (52, 'BIM', '555-0152', 'grace.thompson@college.edu', '2022-08-22', 'active', 'Room 508', 'BUS201');

-- ============================================================
-- Classrooms (linked to teachers)
-- ============================================================
INSERT OR IGNORE INTO Classroom (id, room_number, name)
  VALUES (1, '201', 'Classroom 201');
INSERT OR IGNORE INTO Classroom (id, room_number, name)
  VALUES (2, '101', 'Classroom 101');
INSERT OR IGNORE INTO Classroom (id, room_number, name)
  VALUES (3, '301', 'Classroom 301');

-- Update existing classroom rows if they exist with old room_number
UPDATE Classroom SET room_number = '201', name = 'Classroom 201' WHERE id = 1 AND (room_number != '201' OR name != 'Classroom 201');
UPDATE Classroom SET room_number = '101', name = 'Classroom 101' WHERE id = 2 AND (room_number != '101' OR name != 'Classroom 101');
UPDATE Classroom SET room_number = '301', name = 'Classroom 301' WHERE id = 3 AND (room_number != '301' OR name != 'Classroom 301');

-- Link students 3, 5, 6 to teacher 2's classroom (201)
INSERT OR IGNORE INTO ClassroomStudent (classroom_id, student_id) VALUES (1, 3);
INSERT OR IGNORE INTO ClassroomStudent (classroom_id, student_id) VALUES (1, 5);
INSERT OR IGNORE INTO ClassroomStudent (classroom_id, student_id) VALUES (1, 6);

-- ============================================================
-- TeacherClassroom junction table (many-to-many)
-- All teachers assigned to all three classrooms (101, 201, 301)
-- This ensures at least one classroom has more than 5 teachers
-- ============================================================
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (2, 1);   -- Prof. James Anderson -> 201
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (2, 2);   -- Prof. James Anderson -> 101
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (2, 3);   -- Prof. James Anderson -> 301
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (11, 1);  -- Dr. Robert Chen -> 201
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (11, 2);  -- Dr. Robert Chen -> 101
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (11, 3);  -- Dr. Robert Chen -> 301
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (12, 1);  -- Dr. Lisa Park -> 201
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (12, 2);  -- Dr. Lisa Park -> 101
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (12, 3);  -- Dr. Lisa Park -> 301
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (18, 1);  -- Dr. Aaron Kim -> 201
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (18, 2);  -- Dr. Aaron Kim -> 101
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (18, 3);  -- Dr. Aaron Kim -> 301
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (21, 1);  -- Dr. Sarah Williams -> 201
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (21, 2);  -- Dr. Sarah Williams -> 101
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (21, 3);  -- Dr. Sarah Williams -> 301
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (22, 1);  -- Prof. Michael Brown -> 201
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (22, 2);  -- Prof. Michael Brown -> 101
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (22, 3);  -- Prof. Michael Brown -> 301
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (23, 1);  -- Dr. Jennifer Davis -> 201
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (23, 2);  -- Dr. Jennifer Davis -> 101
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (23, 3);  -- Dr. Jennifer Davis -> 301
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (24, 1);  -- Prof. David Miller -> 201
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (24, 2);  -- Prof. David Miller -> 101
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (24, 3);  -- Prof. David Miller -> 301
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (25, 1);  -- Dr. Amanda Wilson -> 201
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (25, 2);  -- Dr. Amanda Wilson -> 101
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (25, 3);  -- Dr. Amanda Wilson -> 301
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (50, 1);  -- Dr. Priya Sharma -> 201
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (50, 2);  -- Dr. Priya Sharma -> 101
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (50, 3);  -- Dr. Priya Sharma -> 301
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (51, 1);  -- Prof. Daniel Lee -> 201
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (51, 2);  -- Prof. Daniel Lee -> 101
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (51, 3);  -- Prof. Daniel Lee -> 301
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (52, 1);  -- Dr. Grace Thompson -> 201
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (52, 2);  -- Dr. Grace Thompson -> 101
INSERT OR IGNORE INTO TeacherClassroom (teacher_id, classroom_id) VALUES (52, 3);  -- Dr. Grace Thompson -> 301

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
-- Sections (course sections with assigned teachers)
-- ============================================================
INSERT OR IGNORE INTO Sections (id, course_id, section_label, teacher_id, student_count) VALUES
  (1, 1, 'A', 2, 60),   -- CS101 section A, Prof. James Anderson
  (2, 2, 'A', 2, 50),   -- MATH201 section A, Prof. James Anderson
  (3, 5, 'A', 2, 60),   -- OOP section A, Prof. James Anderson
  (4, 6, 'A', 2, 60),   -- CPROG section A, Prof. James Anderson
  (5, 7, 'A', 2, 50),   -- MICRO section A, Prof. James Anderson
  (6, 8, 'A', 2, 60),   -- DBMS section A, Prof. James Anderson
  (7, 9, 'A', 2, 50),   -- OS section A, Prof. James Anderson
  (8, 10, 'A', 2, 60),  -- CN section A, Prof. James Anderson
  (9, 3, 'A', 12, 40),  -- PHYS101 section A, Dr. Lisa Park
  (10, 4, 'A', 11, 30), -- ENG110 section A, Dr. Robert Chen
  (11, 11, 'A', 11, 60), -- MATH101 section A, Dr. Robert Chen
  (12, 12, 'A', 11, 60), -- MATH102 section A, Dr. Robert Chen
  (13, 13, 'A', 11, 60), -- STAT section A, Dr. Robert Chen
  (14, 14, 'A', 11, 50), -- FM section A, Dr. Robert Chen
  (15, 15, 'A', 11, 50), -- BM section A, Dr. Robert Chen
  (16, 16, 'A', 11, 60), -- ECO section A, Dr. Robert Chen
  (17, 17, 'A', 12, 40), -- CHEM101 section A, Dr. Lisa Park
  (18, 18, 'A', 12, 40), -- BIO101 section A, Dr. Lisa Park
  (19, 19, 'A', 12, 50), -- IT section A, Dr. Lisa Park
  (20, 20, 'A', 12, 50); -- WEB section A, Dr. Lisa Park


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

