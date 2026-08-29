import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import AdminDashboard from '@/pages/AdminDashboard';
import StudentDashboard from '@/pages/student/Dashboard';
import FacultyDashboard from '@/pages/faculty/Dashboard';
import AccountantDashboard from '@/pages/AccountantDashboard';
import Students from '@/pages/Students';
import Faculty from '@/pages/Faculty';
import Attendance from '@/pages/Attendance';
import Exams from '@/pages/Exams';
import Timetable from '@/pages/Timetable';
import Teachers from '@/pages/Teachers';
import Fees from '@/pages/Fees';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Logout from '@/pages/Logout';
import Profile from '@/pages/Profile';
import { PrivateRoute } from '@/components/PrivateRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NotificationsProvider } from '@/context/NotificationsContext';
import Notifications from '@/pages/Notifications';
import AdminStudents from '@/pages/admin/Students';
import AdminFaculty from '@/pages/admin/Faculty';
import AdminDepartments from '@/pages/admin/Departments';
import StudentAttendance from '@/pages/student/Attendance';
import StudentGrades from '@/pages/student/Grades';
import StudentTimetable from '@/pages/student/Timetable';
import FacultyAttendance from '@/pages/faculty/Attendance';
import FacultyGrading from '@/pages/faculty/Grading';
import AccountantDues from '@/pages/accountant/Dues';
import AccountantInvoices from '@/pages/accountant/Invoices';
import AccountantPayments from '@/pages/accountant/Payments';
import { ROLE_HOME } from '@/config/navigation';

function RoleHome() {
  const { user } = useAuth();
  return <Navigate to={ROLE_HOME[user?.role] || '/login'} replace />;
}

function App() {
  return (
    <NotificationsProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            {/* Shared by all authenticated users */}
            <Route path="/dashboard" element={<RoleHome />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/teachers" element={<Teachers />} />

          {/* Admin-only management */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/faculty" element={<AdminFaculty />} />
            <Route path="/students" element={<Students />} />
            <Route path="/faculty-list" element={<Faculty />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/courses" element={<AdminDepartments />} />
          </Route>

          {/* Faculty-only */}
          <Route element={<PrivateRoute allowedRoles={['faculty']} />}>
            <Route path="/faculty" element={<FacultyDashboard />} />
            <Route path="/faculty/attendance" element={<FacultyAttendance />} />
            <Route path="/faculty/grading" element={<FacultyGrading />} />
          </Route>

          {/* Student-only */}
          <Route element={<PrivateRoute allowedRoles={['student']} />}>
            <Route path="/student" element={<ErrorBoundary><StudentDashboard /></ErrorBoundary>} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/grades" element={<StudentGrades />} />
            <Route path="/student/timetable" element={<StudentTimetable />} />
          </Route>

          {/* Accountant-only */}
          <Route element={<PrivateRoute allowedRoles={['accountant']} />}>
            <Route path="/accountant" element={<AccountantDashboard />} />
            <Route path="/accountant/dues" element={<AccountantDues />} />
            <Route path="/accountant/invoices" element={<AccountantInvoices />} />
            <Route path="/accountant/payments" element={<AccountantPayments />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </NotificationsProvider>
  );
}

export default App;










