import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import StudentDashboard from '@/pages/student/Dashboard';
import FacultyDashboard from '@/pages/faculty/Dashboard';
import AccountantDashboard from '@/pages/AccountantDashboard';
import Students from '@/pages/Students';
import Faculty from '@/pages/Faculty';
import Courses from '@/pages/Courses';
import Enrollment from '@/pages/Enrollment';
import Attendance from '@/pages/Attendance';
import Exams from '@/pages/Exams';
import Timetable from '@/pages/Timetable';
import Fees from '@/pages/Fees';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Logout from '@/pages/Logout';
import Profile from '@/pages/Profile';
import { PrivateRoute } from '@/components/PrivateRoute';
import AdminStudents from '@/pages/admin/Students';
import AdminFaculty from '@/pages/admin/Faculty';
import AdminCourses from '@/pages/admin/Courses';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/logout" element={<Logout />} />

          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/faculty" element={<AdminFaculty />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/students" element={<Students />} />
            <Route path="/faculty-list" element={<Faculty />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/enrollment" element={<Enrollment />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['student']} />}>
            <Route path="/student" element={<StudentDashboard />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['faculty']} />}>
            <Route path="/faculty" element={<FacultyDashboard />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['accountant']} />}>
            <Route path="/accountant" element={<AccountantDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
