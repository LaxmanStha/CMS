export const ROLE_HOME = {
  admin: "/admin",
  faculty: "/faculty",
  teacher: "/faculty",
  student: "/student",
  accountant: "/accountant",
};

export const ROLE_NAV = {
  admin: [
    { to: "/admin", label: "Dashboard" },
    { to: "/classrooms", label: "Classrooms" },
    { to: "/students", label: "Students" },
    { to: "/teachers", label: "Teachers" },
    { to: "/attendance", label: "Attendance" },
    { to: "/exams", label: "Exams" },
    { to: "/timetable", label: "Timetable" },
    { to: "/fees", label: "Fees" },
    { to: "/reports", label: "Reports" },
    { to: "/settings", label: "Settings" },
  ],
  faculty: [
    { to: "/faculty", label: "Dashboard" },
    { to: "/faculty/attendance", label: "Attendance" },
    { to: "/faculty/grading", label: "Grading" },
    { to: "/timetable", label: "Timetable" },
    { to: "/settings", label: "Settings" },
  ],
  teacher: [
    { to: "/faculty", label: "Dashboard" },
    { to: "/faculty/attendance", label: "Attendance" },
    { to: "/faculty/grading", label: "Grading" },
    { to: "/timetable", label: "Timetable" },
    { to: "/settings", label: "Settings" },
  ],
  student: [
    { to: "/student", label: "Dashboard" },
    { to: "/my-fees", label: "Payments" },
    { to: "/student/attendance", label: "Attendance" },
    { to: "/student/grades", label: "Grades" },
    { to: "/student/timetable", label: "Timetable" },
    { to: "/fees", label: "Fees" },
    { to: "/settings", label: "Settings" },
  ],
  accountant: [
    { to: "/accountant", label: "Dashboard" },
    { to: "/accountant/dues", label: "Dues" },
    { to: "/accountant/invoices", label: "Invoices" },
    { to: "/accountant/payments", label: "Payments" },
    { to: "/fees", label: "Fees" },
    { to: "/reports", label: "Reports" },
    { to: "/settings", label: "Settings" },
  ],
};
