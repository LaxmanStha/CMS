import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarCheck, ClipboardList, Calendar } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Faculty Dashboard</h1>
        <p className="mt-1 text-text-secondary">Your teaching overview at a glance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="My Courses"
          icon={BookOpen}
          iconClass="bg-primary/10 text-primary"
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
          title="Attendance Entry"
          icon={CalendarCheck}
          iconClass="bg-success/10 text-success"
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
          title="Grading"
          icon={ClipboardList}
          iconClass="bg-[#7C3AED]/10 text-[#7C3AED]"
          description="Enter grades for assignments and exams."
          action={
            <Link to="/faculty/grading" className="btn btn-primary btn-sm">
              Enter Grades
            </Link>
          }
          loading={dashLoading}
        />
        <StatCard
          title="Schedule"
          icon={Calendar}
          iconClass="bg-warning/10 text-warning"
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

      {upcomingClasses.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>Upcoming Classes</Card.Title>
            <Card.Description>Your next scheduled classes</Card.Description>
          </Card.Header>
          <Card.Content>
            <ul className="list-group list-group-flush">
              {upcomingClasses.map((cls) => (
                <li key={cls.id} className="list-group-item d-flex justify-content-between bg-transparent border-border">
                  <span>{cls.course}</span>
                  <span className="text-sm text-text-secondary">{cls.day} at {cls.time} - {cls.room}</span>
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
