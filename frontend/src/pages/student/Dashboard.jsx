import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Award, Wallet } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { useMe, useStudentDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { data: meData } = useMe(user?.id);
  const personId = meData?.personId;
  const { data: dashboardData, isLoading: dashLoading } = useStudentDashboard(personId);
  const [fees, setFees] = React.useState([]);
  const [feesLoading, setFeesLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const loadFees = async () => {
      if (!personId) return;
      try {
        const res = await api.get(`/students/${personId}/fees`);
        if (!cancelled) setFees(res.data || []);
      } catch {
        if (!cancelled) setFees([]);
      } finally {
        if (!cancelled) setFeesLoading(false);
      }
    };
    loadFees();
    return () => {
      cancelled = true;
    };
  }, [personId]);

  const pendingFees = React.useMemo(
    () =>
      fees
        .filter((f) => f.status === 'pending' || f.status === 'partial' || f.status === 'overdue')
        .reduce((sum, f) => sum + Math.max(0, (Number(f.amount) || 0) - (Number(f.paid) || 0)), 0),
    [fees]
  );

  const attendancePct = dashboardData?.attendancePercentage ?? 0;
  const upcomingExams = Array.isArray(dashboardData?.upcomingExams) ? dashboardData.upcomingExams : [];
  const recentGrades = Array.isArray(dashboardData?.recentGrades) ? dashboardData.recentGrades : [];
  const enrolledCourses = Array.isArray(dashboardData?.enrolledCourses) ? dashboardData.enrolledCourses : 
                          (dashboardData?.enrolledCourses && typeof dashboardData.enrolledCourses === 'object' 
                            ? Object.values(dashboardData.enrolledCourses) 
                            : []);

  const formatPercent = React.useCallback((v) => `${v}%`, []);
  const formatCurrency = React.useCallback((v) => `$${v.toFixed(2)}`, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Dashboard"
        subtitle="Your academic summary at a glance"
        breadcrumbs={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Student Dashboard' },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Attendance"
          icon={CalendarCheck}
          iconClass="bg-primary/10 text-primary"
          description={attendancePct > 0 ? `Your attendance percentage is ${Math.round(attendancePct)}%.` : 'No attendance records yet.'}
          action={
            <Link to="/student/attendance" className="btn btn-primary btn-sm">
              View Details
            </Link>
          }
          loading={dashLoading}
          value={attendancePct > 0 ? Math.round(attendancePct) : undefined}
          format={formatPercent}
        />
        <StatCard
          title="Grades"
          icon={Award}
          iconClass="bg-primary/10 text-primary"
          description={recentGrades.length > 0 ? `You have ${recentGrades.length} grade record(s).` : 'No grades recorded yet.'}
          action={
            <Link to="/student/grades" className="btn btn-primary btn-sm">
              View Grades
            </Link>
          }
          loading={dashLoading}
          value={recentGrades.length}
        />
        <StatCard
          title="Fees"
          icon={Wallet}
          iconClass="bg-warning/10 text-warning"
          description={pendingFees > 0 ? `You have a pending fee of $${pendingFees.toFixed(2)}.` : 'No pending fees.'}
          action={
            <Link to="/fees" className="btn btn-primary btn-sm">
              View Fees
            </Link>
          }
          loading={feesLoading}
          value={pendingFees}
          format={formatCurrency}
        />
      </div>

      {(upcomingExams.length > 0 || enrolledCourses.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <Card.Header>
              <Card.Title>Upcoming Exams</Card.Title>
              <Card.Description>Scheduled exams for your courses</Card.Description>
            </Card.Header>
            <Card.Content>
              {upcomingExams.length === 0 ? (
                <p className="text-sm text-text-secondary">No upcoming exams.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {upcomingExams.map((exam) => (
                    <li key={exam.id} className="list-group-item d-flex justify-content-between bg-transparent border-border">
                      <span>{exam.name} ({exam.course})</span>
                      <span className="text-sm text-text-secondary">{exam.date || 'TBD'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Enrolled Courses</Card.Title>
              <Card.Description>Your current courses</Card.Description>
            </Card.Header>
            <Card.Content>
              {enrolledCourses.length === 0 ? (
                <p className="text-sm text-text-secondary">No enrolled courses found.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {enrolledCourses.map((course) => (
                    <li key={course.id} className="list-group-item d-flex justify-content-between bg-transparent border-border">
                      <span>{course.code} - {course.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
