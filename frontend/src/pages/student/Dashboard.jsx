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

  const normalizeList = React.useCallback((value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
  }, []);

  const upcomingExams = normalizeList(dashboardData?.upcomingExams).map((exam, index) => {
    const item = exam && typeof exam === 'object' ? exam : { id: index, name: String(exam ?? 'Exam'), course: '', date: '' };
    return {
      id: item.id ?? `${item.name ?? 'exam'}-${index}`,
      name: typeof item.name === 'string' ? item.name : (typeof item.title === 'string' ? item.title : 'Exam'),
      course: typeof item.course === 'string' ? item.course : (typeof item.courseName === 'string' ? item.courseName : (typeof item.subject === 'string' ? item.subject : '')),
      date: typeof item.date === 'string' ? item.date : (typeof item.examDate === 'string' ? item.examDate : (typeof item.schedule === 'string' ? item.schedule : 'TBD')),
    };
  });

  const recentGrades = normalizeList(dashboardData?.recentGrades).map((grade, index) => {
    const item = grade && typeof grade === 'object' ? grade : { id: index, course: '', grade: '' };
    return {
      id: item.id ?? `${item.course ?? 'grade'}-${index}`,
      course: typeof item.course === 'string' ? item.course : (typeof item.subject === 'string' ? item.subject : 'Course'),
      grade: typeof item.grade === 'string' ? item.grade : (typeof item.score === 'string' ? item.score : (typeof item.value === 'string' ? item.value : '')),
    };
  });

  const enrolledCourses = normalizeList(dashboardData?.enrolledCourses).map((course, index) => {
    const item = course && typeof course === 'object' ? course : { id: index, name: String(course ?? 'Course') };
    return {
      id: item.id ?? `${item.code ?? item.name ?? 'course'}-${index}`,
      code: typeof item.code === 'string' ? item.code : (typeof item.courseCode === 'string' ? item.courseCode : ''),
      name: typeof item.name === 'string' ? item.name : (typeof item.title === 'string' ? item.title : (typeof item.courseName === 'string' ? item.courseName : 'Course')),
    };
  });

  const formatPercent = React.useCallback((v) => `${v}%`, []);
  const formatCurrency = React.useCallback((v) => `$${v.toFixed(2)}`, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Attendance"
          icon={CalendarCheck}
          iconClass="bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
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
          iconClass="bg-[var(--color-info)]/10 text-[var(--color-info)]"
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
          iconClass="bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
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
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No upcoming exams.</p>
              ) : (
                <ul className="space-y-2">
                  {upcomingExams.map((exam) => (
                    <li key={exam.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                      <span>{exam.name} ({exam.course})</span>
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{exam.date || 'TBD'}</span>
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
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No enrolled courses found.</p>
              ) : (
                <ul className="space-y-2">
                  {enrolledCourses.map((course) => (
                    <li key={course.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
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