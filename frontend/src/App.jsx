import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import LoadingState from '@/components/ui/LoadingState';
import { PrivateRoute } from '@/components/PrivateRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { ROLE_HOME } from '@/config/navigation';

const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const StudentDashboard = lazy(() => import('@/pages/student/Dashboard'));
const FacultyDashboard = lazy(() => import('@/pages/faculty/Dashboard'));
const AccountantDashboard = lazy(() => import('@/pages/AccountantDashboard'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));
const Logout = lazy(() => import('@/pages/Logout'));
const Timetable = lazy(() => import('@/pages/Timetable'));
const Fees = lazy(() => import('@/pages/Fees'));
const MyFees = lazy(() => import('@/pages/MyFees'));
const Reports = lazy(() => import('@/pages/Reports'));
const Teachers = lazy(() => import('@/pages/Teachers'));
const Students = lazy(() => import('@/pages/Students'));
const Attendance = lazy(() => import('@/pages/Attendance'));
const Exams = lazy(() => import('@/pages/Exams'));
const InventoryDashboard = lazy(() => import('@/pages/InventoryDashboard'));
const StoreInventory = lazy(() => import('@/components/StoreInventory'));
const AdminStudents = lazy(() => import('@/pages/admin/Students'));
const AdminTeachers = lazy(() => import('@/pages/admin/Teachers'));
const AdminClassrooms = lazy(() => import('@/pages/admin/Classrooms'));
const StudentAttendance = lazy(() => import('@/pages/student/Attendance'));
const StudentGrades = lazy(() => import('@/pages/student/Grades'));
const StudentTimetable = lazy(() => import('@/pages/student/Timetable'));
const FacultyAttendance = lazy(() => import('@/pages/faculty/Attendance'));
const FacultyGrading = lazy(() => import('@/pages/faculty/Grading'));
const AccountantDues = lazy(() => import('@/pages/accountant/Dues'));
const AccountantInvoices = lazy(() => import('@/pages/accountant/Invoices'));
const AccountantPayments = lazy(() => import('@/pages/accountant/Payments'));

function RoleHome() {
  const { user } = useAuth();
  return <Navigate to={ROLE_HOME[user?.role] || "/login"} replace />;
}

function withBoundary(node) {
  return <ErrorBoundary>{node}</ErrorBoundary>;
}

function App() {
  useEffect(() => {
    document.body.classList.add("dark-premium");
    document.body.classList.remove("light");
  }, []);

  const fallback = <LoadingState label="Loading…" size="lg" />;

  return (
    <NotificationsProvider>
      <Suspense fallback={fallback}>
        <Routes>
          <Route path="/login" element={withBoundary(<Login />)} />
          <Route path="/inventory" element={withBoundary(<InventoryDashboard />)} />
          <Route path="/store-inventory" element={withBoundary(<StoreInventory />)} />

          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<RoleHome />} />
              <Route path="/notifications" element={withBoundary(<Notifications />)} />
              <Route path="/profile" element={withBoundary(<Profile />)} />
              <Route path="/settings" element={withBoundary(<Settings />)} />
              <Route path="/logout" element={withBoundary(<Logout />)} />
              <Route path="/timetable" element={withBoundary(<Timetable />)} />
              <Route path="/fees" element={withBoundary(<Fees />)} />
              <Route path="/my-fees" element={withBoundary(<MyFees />)} />
              <Route path="/reports" element={withBoundary(<Reports />)} />
              <Route path="/teachers" element={withBoundary(<Teachers />)} />

<Route element={<PrivateRoute allowedRoles={["admin"]} />}>
                <Route path="/admin" element={withBoundary(<AdminDashboard />)} />
                <Route path="/classrooms" element={withBoundary(<AdminClassrooms />)} />
                <Route path="/admin/students" element={withBoundary(<AdminStudents />)} />
                <Route path="/admin/teachers" element={withBoundary(<AdminTeachers />)} />
                <Route path="/students" element={withBoundary(<Students />)} />
                <Route path="/attendance" element={withBoundary(<Attendance />)} />
                <Route path="/exams" element={withBoundary(<Exams />)} />
              </Route>

              <Route element={<PrivateRoute allowedRoles={["faculty", "teacher"]} />}>
                <Route path="/faculty" element={withBoundary(<FacultyDashboard />)} />
                <Route path="/faculty/attendance" element={withBoundary(<FacultyAttendance />)} />
                <Route path="/faculty/grading" element={withBoundary(<FacultyGrading />)} />
              </Route>

              <Route element={<PrivateRoute allowedRoles={["student"]} />}>
                <Route path="/student" element={withBoundary(<StudentDashboard />)} />
                <Route path="/student/attendance" element={withBoundary(<StudentAttendance />)} />
                <Route path="/student/grades" element={withBoundary(<StudentGrades />)} />
                <Route path="/student/timetable" element={withBoundary(<StudentTimetable />)} />
              </Route>

              <Route element={<PrivateRoute allowedRoles={["accountant"]} />}>
                <Route path="/accountant" element={withBoundary(<AccountantDashboard />)} />
                <Route path="/accountant/dues" element={withBoundary(<AccountantDues />)} />
                <Route path="/accountant/invoices" element={withBoundary(<AccountantInvoices />)} />
                <Route path="/accountant/payments" element={withBoundary(<AccountantPayments />)} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </NotificationsProvider>
  );
}

export default App;