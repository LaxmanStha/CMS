-- Temporary seed data for all tables (collision-safe IDs).
PRAGMA foreign_keys = ON;

-- Courses (keep 101/102, add more)
INSERT INTO Course (id, code, name, credits, department, maxCapacity, currentEnrollment, semester, status)
SELECT 201,'CS201','Data Structures',4,'Computer Science',60,42,'Fall 2025','active' WHERE NOT EXISTS (SELECT 1 FROM Course WHERE id=201);
INSERT INTO Course (id, code, name, credits, department, maxCapacity, currentEnrollment, semester, status)
SELECT 202,'MATH201','Calculus II',4,'Mathematics',50,38,'Fall 2025','active' WHERE NOT EXISTS (SELECT 1 FROM Course WHERE id=202);
INSERT INTO Course (id, code, name, credits, department, maxCapacity, currentEnrollment, semester, status)
SELECT 203,'PHYS101','Physics I',3,'Physics',45,30,'Fall 2025','active' WHERE NOT EXISTS (SELECT 1 FROM Course WHERE id=203);
INSERT INTO Course (id, code, name, credits, department, maxCapacity, currentEnrollment, semester, status)
SELECT 204,'ENG105','Technical Writing',2,'Humanities',70,55,'Fall 2025','active' WHERE NOT EXISTS (SELECT 1 FROM Course WHERE id=204);

-- Faculty (keep 3/4, add more — new Person + Faculty)
INSERT INTO Person (id, name, contactInfo, discriminator) SELECT 21,'Dr. Alan Turing','a.turing@college.edu','Faculty' WHERE NOT EXISTS (SELECT 1 FROM Person WHERE id=21);
INSERT INTO Faculty (id, teachingLoad, department, title, email, hireDate, status) SELECT 21,2,'Computer Science','Associate Professor','a.turing@college.edu','2021-08-15','active' WHERE NOT EXISTS (SELECT 1 FROM Faculty WHERE id=21);
INSERT INTO Person (id, name, contactInfo, discriminator) SELECT 22,'Dr. Grace Hopper','g.hopper@college.edu','Faculty' WHERE NOT EXISTS (SELECT 1 FROM Person WHERE id=22);
INSERT INTO Faculty (id, teachingLoad, department, title, email, hireDate, status) SELECT 22,3,'Mathematics','Professor','g.hopper@college.edu','2018-01-10','active' WHERE NOT EXISTS (SELECT 1 FROM Faculty WHERE id=22);
INSERT INTO Person (id, name, contactInfo, discriminator) SELECT 23,'Dr. Carl Sagan','c.sagan@college.edu','Faculty' WHERE NOT EXISTS (SELECT 1 FROM Person WHERE id=23);
INSERT INTO Faculty (id, teachingLoad, department, title, email, hireDate, status) SELECT 23,2,'Physics','Assistant Professor','c.sagan@college.edu','2022-09-01','active' WHERE NOT EXISTS (SELECT 1 FROM Faculty WHERE id=23);

-- Students (keep 1,2,5,6,7,8; add more)
INSERT INTO Person (id, name, contactInfo, discriminator) SELECT 13,'Emma Watson','emma.w@college.edu','Student' WHERE NOT EXISTS (SELECT 1 FROM Person WHERE id=13);
INSERT INTO Student (id, gpa, cgpa, program, year, status, advisor) SELECT 13,3.9,3.8,'Computer Science',2,'active','Dr. Alan Turing' WHERE NOT EXISTS (SELECT 1 FROM Student WHERE id=13);
INSERT INTO Person (id, name, contactInfo, discriminator) SELECT 14,'Liam Neeson','liam.n@college.edu','Student' WHERE NOT EXISTS (SELECT 1 FROM Person WHERE id=14);
INSERT INTO Student (id, gpa, cgpa, program, year, status, advisor) SELECT 14,3.4,3.5,'Mathematics',3,'active','Dr. Grace Hopper' WHERE NOT EXISTS (SELECT 1 FROM Student WHERE id=14);
INSERT INTO Person (id, name, contactInfo, discriminator) SELECT 15,'Olivia Reed','olivia.r@college.edu','Student' WHERE NOT EXISTS (SELECT 1 FROM Person WHERE id=15);
INSERT INTO Student (id, gpa, cgpa, program, year, status, advisor) SELECT 15,3.1,3.2,'Physics',1,'pending','Dr. Carl Sagan' WHERE NOT EXISTS (SELECT 1 FROM Student WHERE id=15);
INSERT INTO Person (id, name, contactInfo, discriminator) SELECT 16,'Noah Carter','noah.c@college.edu','Student' WHERE NOT EXISTS (SELECT 1 FROM Person WHERE id=16);
INSERT INTO Student (id, gpa, cgpa, program, year, status, advisor) SELECT 16,2.8,2.9,'Computer Science',4,'active','Dr. Alan Turing' WHERE NOT EXISTS (SELECT 1 FROM Student WHERE id=16);
INSERT INTO Person (id, name, contactInfo, discriminator) SELECT 17,'Ava Brooks','ava.b@college.edu','Student' WHERE NOT EXISTS (SELECT 1 FROM Person WHERE id=17);
INSERT INTO Student (id, gpa, cgpa, program, year, status, advisor) SELECT 17,3.6,3.6,'Humanities',2,'active','Dr. Sarah Johnson' WHERE NOT EXISTS (SELECT 1 FROM Student WHERE id=17);

-- Enrollments (studentId -> Person.id, courseId -> Course.id)
INSERT INTO Enrollment (studentId, courseId, enrollmentDate, grade, status)
SELECT 1,201,date('now','-60 day'),3.5,'enrolled' WHERE NOT EXISTS (SELECT 1 FROM Enrollment WHERE studentId=1 AND courseId=201);
INSERT INTO Enrollment (studentId, courseId, enrollmentDate, grade, status)
SELECT 1,202,date('now','-60 day'),3.7,'enrolled' WHERE NOT EXISTS (SELECT 1 FROM Enrollment WHERE studentId=1 AND courseId=202);
INSERT INTO Enrollment (studentId, courseId, enrollmentDate, grade, status)
SELECT 13,201,date('now','-55 day'),NULL,'enrolled' WHERE NOT EXISTS (SELECT 1 FROM Enrollment WHERE studentId=13 AND courseId=201);
INSERT INTO Enrollment (studentId, courseId, enrollmentDate, grade, status)
SELECT 14,202,date('now','-55 day'),NULL,'enrolled' WHERE NOT EXISTS (SELECT 1 FROM Enrollment WHERE studentId=14 AND courseId=202);
INSERT INTO Enrollment (studentId, courseId, enrollmentDate, grade, status)
SELECT 15,203,date('now','-50 day'),NULL,'enrolled' WHERE NOT EXISTS (SELECT 1 FROM Enrollment WHERE studentId=15 AND courseId=203);
INSERT INTO Enrollment (studentId, courseId, enrollmentDate, grade, status)
SELECT 16,201,date('now','-50 day'),NULL,'enrolled' WHERE NOT EXISTS (SELECT 1 FROM Enrollment WHERE studentId=16 AND courseId=201);
INSERT INTO Enrollment (studentId, courseId, enrollmentDate, grade, status)
SELECT 17,204,date('now','-45 day'),NULL,'enrolled' WHERE NOT EXISTS (SELECT 1 FROM Enrollment WHERE studentId=17 AND courseId=204);

-- Exams
INSERT INTO Exam (name, course, date, startTime, endTime, type, location, totalMarks, status, students)
SELECT 'Midterm','CS201','2025-10-15','09:00','11:00','midterm','Hall A',100,'scheduled',42 WHERE NOT EXISTS (SELECT 1 FROM Exam WHERE name='Midterm' AND course='CS201');
INSERT INTO Exam (name, course, date, startTime, endTime, type, location, totalMarks, status, students)
SELECT 'Quiz 1','MATH201','2025-10-02','10:00','10:45','quiz','Room 102',20,'scheduled',38 WHERE NOT EXISTS (SELECT 1 FROM Exam WHERE name='Quiz 1' AND course='MATH201');
INSERT INTO Exam (name, course, date, startTime, endTime, type, location, totalMarks, status, students)
SELECT 'Lab Final','PHYS101','2025-10-20','14:00','16:00','lab','Lab 1',50,'scheduled',30 WHERE NOT EXISTS (SELECT 1 FROM Exam WHERE name='Lab Final' AND course='PHYS101');
INSERT INTO Exam (name, course, date, startTime, endTime, type, location, totalMarks, status, students)
SELECT 'Essay','ENG105','2025-10-25','09:00','12:00','essay','Room 110',30,'scheduled',55 WHERE NOT EXISTS (SELECT 1 FROM Exam WHERE name='Essay' AND course='ENG105');

-- Timetable
INSERT INTO Timetable (course, day, time, room, instructor, type)
SELECT 'CS201','Mon/Wed','09:00-10:30','Room 101','Dr. Alan Turing','lecture' WHERE NOT EXISTS (SELECT 1 FROM Timetable WHERE course='CS201' AND day='Mon/Wed');
INSERT INTO Timetable (course, day, time, room, instructor, type)
SELECT 'MATH201','Tue/Thu','10:30-12:00','Room 102','Dr. Grace Hopper','lecture' WHERE NOT EXISTS (SELECT 1 FROM Timetable WHERE course='MATH201' AND day='Tue/Thu');
INSERT INTO Timetable (course, day, time, room, instructor, type)
SELECT 'PHYS101','Mon/Wed','13:00-14:30','Lab 1','Dr. Carl Sagan','lab' WHERE NOT EXISTS (SELECT 1 FROM Timetable WHERE course='PHYS101' AND day='Mon/Wed');
INSERT INTO Timetable (course, day, time, room, instructor, type)
SELECT 'ENG105','Fri','11:00-12:30','Room 110','Dr. Sarah Johnson','lecture' WHERE NOT EXISTS (SELECT 1 FROM Timetable WHERE course='ENG105' AND day='Fri');

-- Attendance
INSERT INTO Attendance (studentId, student, course, date, status, time, notes)
SELECT '1','Alice Johnson','CS201',date('now'),'present','09:05','' WHERE NOT EXISTS (SELECT 1 FROM Attendance WHERE studentId='1' AND course='CS201' AND date=date('now'));
INSERT INTO Attendance (studentId, student, course, date, status, time, notes)
SELECT '13','Emma Watson','CS201',date('now'),'present','09:02','' WHERE NOT EXISTS (SELECT 1 FROM Attendance WHERE studentId='13' AND course='CS201' AND date=date('now'));
INSERT INTO Attendance (studentId, student, course, date, status, time, notes)
SELECT '14','Liam Neeson','MATH201',date('now','-1 day'),'absent','10:35','Sick leave' WHERE NOT EXISTS (SELECT 1 FROM Attendance WHERE studentId='14' AND course='MATH201' AND date=date('now','-1 day'));
INSERT INTO Attendance (studentId, student, course, date, status, time, notes)
SELECT '15','Olivia Reed','PHYS101',date('now','-1 day'),'present','13:10','' WHERE NOT EXISTS (SELECT 1 FROM Attendance WHERE studentId='15' AND course='PHYS101' AND date=date('now','-1 day'));
INSERT INTO Attendance (studentId, student, course, date, status, time, notes)
SELECT '16','Noah Carter','CS201',date('now','-2 day'),'late','09:20','Traffic' WHERE NOT EXISTS (SELECT 1 FROM Attendance WHERE studentId='16' AND course='CS201' AND date=date('now','-2 day'));

-- Fees (studentId/student, course, amount, paid, dueDate, paidDate, semester, status)
INSERT INTO Fee (studentId, student, course, amount, paid, dueDate, paidDate, semester, status)
SELECT '1','Alice Johnson','Fall 2025',5000,5000,'2025-09-01','2025-08-20','Fall 2025','paid' WHERE NOT EXISTS (SELECT 1 FROM Fee WHERE studentId='1' AND status='paid');
INSERT INTO Fee (studentId, student, course, amount, paid, dueDate, paidDate, semester, status)
SELECT '13','Emma Watson','Fall 2025',5000,2500,'2025-09-15',NULL,'Fall 2025','partial' WHERE NOT EXISTS (SELECT 1 FROM Fee WHERE studentId='13' AND status='partial');
INSERT INTO Fee (studentId, student, course, amount, paid, dueDate, paidDate, semester, status)
SELECT '14','Liam Neeson','Fall 2025',5000,0,'2025-09-15',NULL,'Fall 2025','overdue' WHERE NOT EXISTS (SELECT 1 FROM Fee WHERE studentId='14' AND status='overdue');
INSERT INTO Fee (studentId, student, course, amount, paid, dueDate, paidDate, semester, status)
SELECT '15','Olivia Reed','Fall 2025',5000,1000,'2025-10-01',NULL,'Fall 2025','pending' WHERE NOT EXISTS (SELECT 1 FROM Fee WHERE studentId='15' AND status='pending');
INSERT INTO Fee (studentId, student, course, amount, paid, dueDate, paidDate, semester, status)
SELECT '16','Noah Carter','Fall 2025',5000,5000,'2025-09-01','2025-08-25','Fall 2025','paid' WHERE NOT EXISTS (SELECT 1 FROM Fee WHERE studentId='16' AND status='paid');
INSERT INTO Fee (studentId, student, course, amount, paid, dueDate, paidDate, semester, status)
SELECT '17','Ava Brooks','Fall 2025',5000,0,'2025-09-10',NULL,'Fall 2025','overdue' WHERE NOT EXISTS (SELECT 1 FROM Fee WHERE studentId='17' AND status='overdue');
