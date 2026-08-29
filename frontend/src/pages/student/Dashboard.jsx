import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Award, Wallet } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
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
    const loadFees = async () => {
      if (!personId) return;
      try {
        const res = await api.get(`/students/${personId}/fees`);
        setFees(res.data || []);
      } catch {
        setFees([]);
      } finally {
        setFeesLoading(false);
      }
    };
    loadFees();
  }, [personId]);

  const pendingFees = fees
    .filter((f) => f.status === 'pending' || f.status === 'partial' || f.status === 'overdue')
    .reduce((sum, f) => sum + Math.max(0, (Number(f.amount) || 0) - (Number(f.paid) || 0)), 0);

  const attendancePct = dashboardData?.attendancePercentage ?? 0;
  const upcomingExams = dashboardData?.upcomingExams || [];
  const recentGrades = dashboardData?.recentGrades || [];
  const enrolledCourses = dashboardData?.enrolledCourses || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Student Dashboard</h1>
        <p className="mt-1 text-text-secondary">Your academic summary at a glance</p>
      </div>

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
          format={(v) => `${v}%`}
        />
        <StatCard
          title="Grades"
          icon={Award}
          iconClass="bg-[#7C3AED]/10 text-[#7C3AED]"
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
          format={(v) => `$${v.toFixed(2)}`}
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
