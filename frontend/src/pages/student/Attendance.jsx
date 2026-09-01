import React, { useEffect, useState, useMemo } from 'react';
import { CalendarCheck, BookOpen, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import StatCard from '@/components/ui/StatCard';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';
import { useStudentDashboard } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';

const getPercentageClass = (percentage) => {
  if (percentage >= 90) return 'bg-success/10 text-success';
  if (percentage >= 75) return 'bg-warning/10 text-warning';
  return 'bg-danger/10 text-danger';
};

const columns = [
  { key: 'name', header: 'Course', render: (v, row) => row.name || row.course || 'N/A' },
  { key: 'code', header: 'Code', render: (v, row) => row.code || row.course || 'N/A' },
  { key: 'attended', header: 'Attended', width: '100px' },
  { key: 'total', header: 'Total', width: '100px' },
  { key: 'percentage', header: 'Attendance', render: (v) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-background overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', getPercentageClass(v))} style={{ width: `${v}%` }} />
      </div>
      <span className="text-sm font-medium text-text-primary w-10 text-right">{v}%</span>
    </div>
  ), width: '200px' },
  { key: 'status', header: 'Status', render: (v) => (
    <Badge variant={v >= 75 ? 'success' : v >= 60 ? 'warning' : 'danger'} size="sm">
      {v >= 75 ? 'Good' : v >= 60 ? 'Warning' : 'Low'}
    </Badge>
  ), width: '100px' },
];

const StudentAttendance = () => {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: dashLoading } = useStudentDashboard(user?.id);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [classroom, setClassroom] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await api.get(`/students/${user?.id}/attendance`);
        const data = Array.isArray(res.data) ? res.data : [];
        setRecords(data);
        if (data.length > 0 && data[0].classroom) {
          setClassroom(data[0].classroom);
        }
      } catch {
        setRecords([]);
      } finally {
        setRecordsLoading(false);
      }
    };
    fetchRecords();
  }, [user?.id]);

  const overallPercentage = dashboardData?.attendancePercentage ?? 0;
  const totalAttended = records.filter(r => r.status === 'present').length;
  const totalClasses = records.length;

  const courseStats = useMemo(() => {
    const map = new Map();
    records.forEach(r => {
      const key = r.course || 'Unknown';
      if (!map.has(key)) map.set(key, { name: key, code: key, attended: 0, total: 0 });
      const entry = map.get(key);
      entry.total++;
      if (r.status === 'present') entry.attended++;
    });
    return Array.from(map.values()).map(c => ({
      ...c,
      percentage: c.total > 0 ? Math.round((c.attended / c.total) * 100) : 0,
    }));
  }, [records]);

  if (dashLoading || recordsLoading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="ml-2 text-text-secondary">Loading attendance...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">My Attendance</h1>
        <p className="text-text-secondary mt-1">Track your class attendance and participation</p>
        {classroom && <p className="text-sm text-text-secondary mt-1">Classroom: <span className="font-medium text-text-primary">{classroom}</span></p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          icon={CalendarCheck}
          iconClass="bg-primary/10 text-primary"
          loading={dashLoading}
          value={overallPercentage > 0 ? Math.round(overallPercentage) : 0}
          format={(v) => `${v}%`}
        />
        <StatCard
          title="Classes Attended"
          icon={CheckCircle}
          iconClass="bg-success/10 text-success"
          loading={recordsLoading}
          value={totalAttended}
        />
        <StatCard
          title="Total Classes"
          icon={BookOpen}
          iconClass="bg-info/10 text-info"
          loading={recordsLoading}
          value={totalClasses}
        />
        <StatCard
          title="Absences"
          icon={XCircle}
          iconClass="bg-danger/10 text-danger"
          loading={recordsLoading}
          value={totalClasses - totalAttended}
        />
      </div>

      <Card>
        <Card.Header className="p-6">
          <Card.Title>Course-wise Attendance</Card.Title>
          <Card.Description>Your attendance breakdown by course</Card.Description>
        </Card.Header>
        <Card.Content className="p-0">
          {courseStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <CalendarCheck className="w-12 h-12 mb-3 text-border" />
              <p className="text-lg font-medium">No attendance records yet</p>
              <p className="text-sm">Your course attendance will appear here once recorded.</p>
            </div>
          ) : (
            <Table
              columns={columns}
              data={courseStats}
              keyField="code"
              searchable={false}
              filterable={false}
              paginated={false}
              emptyMessage="No attendance records found"
            />
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default StudentAttendance;
