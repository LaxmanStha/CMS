import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarCheck, ClipboardList, Calendar, Users, TrendingUp } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import {
  ChartCard,
  BarChartBox,
  PieChartBox,
  CHART_PALETTE,
} from '@/components/charts/Charts';
import { useMe, useFacultyDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/context/AuthContext';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const { data: meData } = useMe(user?.id);
  const personId = meData?.personId;
  const { data: dashboardData, isLoading: dashLoading } = useFacultyDashboard(personId);

  const courses = dashboardData?.coursesTaught || [];
  const todayAttendance = dashboardData?.todayAttendance || { present: 0, total: 0 };
  const upcomingClasses = dashboardData?.upcomingClasses || [];

  // Calculate student statistics from courses
  const totalStudents = useMemo(() => {
    return courses.reduce((sum, course) => sum + (course.studentCount || 0), 0);
  }, [courses]);

  const studentsByCourse = useMemo(() => {
    return courses.map((course) => ({
      name: course.code || course.name,
      value: course.studentCount || 0,
    }));
  }, [courses]);

  const attendanceByCourse = useMemo(() => {
    return courses.map((course) => ({
      name: course.code || course.name,
      Present: course.attendanceStats?.present || 0,
      Absent: course.attendanceStats?.absent || 0,
    }));
  }, [courses]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Courses"
          icon={BookOpen}
          iconClass="bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
          description={courses.length > 0 ? `You are teaching ${courses.length} course(s) this semester.` : 'No courses assigned yet.'}
          action={
            <Link to="/faculty/attendance" className="btn btn-primary btn-sm">
              Take Attendance
            </Link>
          }
          loading={dashLoading}
          value={courses.length}
        />
        <StatCard
          title="Total Students"
          icon={Users}
          iconClass="bg-[var(--color-info)]/10 text-[var(--color-info)]"
          description={totalStudents > 0 ? `${totalStudents} students across your courses.` : 'No students enrolled.'}
          action={
            <Link to="/faculty/attendance" className="btn btn-primary btn-sm">
              View Students
            </Link>
          }
          loading={dashLoading}
          value={totalStudents}
        />
        <StatCard
          title="Attendance Entry"
          icon={CalendarCheck}
          iconClass="bg-[var(--color-success)]/10 text-[var(--color-success)]"
          description={todayAttendance.total > 0 ? `Today: ${todayAttendance.present}/${todayAttendance.total} present.` : 'No attendance recorded today.'}
          action={
            <Link to="/faculty/attendance" className="btn btn-primary btn-sm">
              Take Attendance
            </Link>
          }
          loading={dashLoading}
          value={todayAttendance.total > 0 ? Math.round((todayAttendance.present / todayAttendance.total) * 100) : 0}
          format={(v) => `${v}%`}
        />
        <StatCard
          title="Schedule"
          icon={Calendar}
          iconClass="bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
          description={upcomingClasses.length > 0 ? `You have ${upcomingClasses.length} upcoming class(es).` : 'No upcoming classes.'}
          action={
            <Link to="/timetable" className="btn btn-primary btn-sm">
              View Schedule
            </Link>
          }
          loading={dashLoading}
          value={upcomingClasses.length}
        />
      </div>

      {courses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Students per Course" subtitle="Enrollment distribution across your courses">
            <PieChartBox
              data={studentsByCourse}
              nameKey="name"
              dataKey="value"
              colors={CHART_PALETTE}
              donut
              centerLabel={`${totalStudents} total`}
            />
          </ChartCard>

          <ChartCard title="Attendance Overview" subtitle="Present vs Absent by course">
            <BarChartBox
              data={attendanceByCourse}
              xKey="name"
              bars={[
                { key: "Present", color: CHART_PALETTE[0] },
                { key: "Absent", color: CHART_PALETTE[3] },
              ]}
            />
          </ChartCard>
        </div>
      )}

      {upcomingClasses.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>Upcoming Classes</Card.Title>
            <Card.Description>Your next scheduled classes</Card.Description>
          </Card.Header>
          <Card.Content>
            <ul className="space-y-2">
              {upcomingClasses.map((cls) => (
                <li key={cls.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                  <span>{cls.course}</span>
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{cls.day} at {cls.time} - {cls.room}</span>
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default FacultyDashboard;