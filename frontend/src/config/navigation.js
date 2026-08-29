export const ROLE_HOME = {
  admin: '/admin',
  faculty: '/faculty',
  student: '/student',
  accountant: '/accountant',
};

export const ROLE_NAV = {
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/students', label: 'Students' },
    { to: '/faculty-list', label: 'Faculty' },
    { to: '/courses', label: 'Courses' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/exams', label: 'Exams' },
    { to: '/timetable', label: 'Timetable' },
    { to: '/fees', label: 'Fees' },
    { to: '/reports', label: 'Reports' },
    { to: '/settings', label: 'Settings' },
  ],
  faculty: [
    { to: '/faculty', label: 'Dashboard' },
    { to: '/faculty/attendance', label: 'Attendance' },
    { to: '/faculty/grading', label: 'Grading' },
    { to: '/timetable', label: 'Timetable' },
    { to: '/settings', label: 'Settings' },
  ],
  student: [
    { to: '/student', label: 'Dashboard' },
    { to: '/student/attendance', label: 'Attendance' },
    { to: '/student/grades', label: 'Grades' },
    { to: '/student/timetable', label: 'Timetable' },
    { to: '/fees', label: 'Fees' },
    { to: '/settings', label: 'Settings' },
  ],
  accountant: [
    { to: '/accountant', label: 'Dashboard' },
    { to: '/accountant/dues', label: 'Dues' },
    { to: '/accountant/invoices', label: 'Invoices' },
    { to: '/accountant/payments', label: 'Payments' },
    { to: '/fees', label: 'Fees' },
    { to: '/reports', label: 'Reports' },
    { to: '/settings', label: 'Settings' },
  ],
};



