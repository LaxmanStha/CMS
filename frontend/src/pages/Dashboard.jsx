import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, GraduationCap, BookOpen, DollarSign, CheckCircle, 
  TrendingUp, ArrowUpRight, ArrowDownRight, Clock, FileText,
  Calendar, AlertTriangle, Bell, Plus, Search, Filter,
  Upload, MoreHorizontal, ChevronDown, ChevronUp,
  UserPlus, Mail, Shield, BarChart3, Activity, Target,
  Eye, Edit, Trash2
} from 'lucide-react';
import { cn, formatNumber, formatCurrency, animateCounter } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { useToast } from '@/context/ToastContext';
import api from '@/services/api';

const StatCard = ({ title, value, change, icon: Icon, iconBg, trend = 'up', loading = false }) => {
  const valueRef = useRef(null);

  useEffect(() => {
    if (loading || !valueRef.current) return;

    const target = typeof value === 'number' ? value : parseInt(value.toString().replace(/[^0-9]/g, '')) || 0;
    animateCounter(valueRef.current, 0, target, 1500);
  }, [loading, value]);

  return (
      <Card hover className={cn('relative overflow-hidden', loading && 'animate-pulse')}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
            <div className="flex items-end gap-3">
              <span ref={valueRef} className="stat-number text-3xl font-bold text-text-primary">
                {loading ? (
                  <span className="skeleton h-8 w-24" />
                ) : (
                  '0'
                )}
              </span>
              {change && (
                <span className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  trend === 'up' ? 'text-dappr-green' : 'text-dappr-red'
                )}>
                {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span>{change}</span>
              </span>
            )}
          </div>
        </div>
        <div className={cn('p-3 rounded-xl flex-shrink-0', iconBg)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {loading && (
        <div className="absolute inset-0 bg-white/50 rounded-2xl flex items-center justify-center">
          <div className="flex gap-2">
            <div className="w-4 h-4 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-4 h-4 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-4 h-4 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </Card>
  );
};

const MiniChart = ({ data, color, height = 60 }) => {
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (!svgRef.current || !data.length) return;
    const svg = svgRef.current;
    const width = svg.clientWidth || 200;
    const chartHeight = height;
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = chartHeight - ((val - minVal) / range) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    const path = svg.querySelector('path');
    if (path) {
      path.setAttribute('d', `M${points} L${width},${chartHeight} L0,${chartHeight} Z`);
    }
    
    const line = svg.querySelector('.chart-line');
    if (line) {
      line.setAttribute('points', points);
    }
  }, [data, height]);

  return (
    <svg ref={svgRef} className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon className="chart-area" fill="url(#chart-gradient)" points="" />
      <polyline className="chart-line" fill="none" stroke={color} strokeWidth="2" points="" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const RecentActivity = ({ activities = [] }) => {
  return (
    <Card className="dark-card">
      <Card.Header className="flex items-center justify-between">
        <div>
          <Card.Title className="text-white">Recent Activity</Card.Title>
          <Card.Description className="text-white/60">Latest updates across the platform</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        {activities.length === 0 ? (
          <p className="text-sm text-white/60">No recent activity found.</p>
        ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div 
                key={index} 
                className={cn(
                  'flex items-start gap-4 p-3 rounded-xl transition-all hover:bg-white/5',
                  index === activities.length - 1 ? 'border-b-0' : 'border-b border-white/10'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', `bg-${activity.color}/15 text-${activity.color}`)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{activity.title}</p>
                  <p className="text-sm text-white/60 truncate">{activity.desc}</p>
                </div>
                <span className="text-xs text-white/40 whitespace-nowrap flex-shrink-0">{activity.time}</span>
              </div>
            );
          })}
        </div>
        )}
      </Card.Content>
    </Card>
  );
};

const QuickActions = () => {
  const actions = [
    { label: 'Add Student', icon: UserPlus, color: 'primary', href: '/students/new' },
    { label: 'Create Course', icon: BookOpen, color: 'secondary', href: '/courses/new' },
    { label: 'Schedule Exam', icon: FileText, color: 'accent', href: '/exams/new' },
    { label: 'Generate Report', icon: BarChart3, color: 'success', href: '/reports/new' },
    { label: 'Manage Fees', icon: DollarSign, color: 'warning', href: '/fees' },
    { label: 'View Timetable', icon: Calendar, color: 'info', href: '/timetable' },
    { label: 'Send Notification', icon: Bell, color: 'danger', href: '/notifications/new' },
    { label: 'Import Data', icon: Upload, color: 'primary', href: '/import' },
  ];

  return (
    <Card>
      <Card.Header>
        <Card.Title>Quick Actions</Card.Title>
        <Card.Description>Common tasks and shortcuts</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border border-border',
                  'hover:bg-hover hover:border-primary/30 transition-all duration-200',
                  'group'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', `bg-${action.color}/10 text-${action.color}`, 'group-hover:bg-primary/10 group-hover:text-primary transition-colors')}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-text-primary text-center">{action.label}</span>
              </a>
            );
          })}
        </div>
      </Card.Content>
    </Card>
  );
};

const UpcomingEvents = ({ events = [
    { title: 'Mid-term Examinations', date: '2024-02-15', time: '09:00 AM', type: 'exam', location: 'Main Hall' },
    { title: 'Faculty Meeting', date: '2024-02-18', time: '02:00 PM', type: 'meeting', location: 'Conference Room A' },
    { title: 'Spring Semester Registration', date: '2024-02-20', time: 'All Day', type: 'event', location: 'Online Portal' },
    { title: 'Guest Lecture: AI in Education', date: '2024-02-22', time: '11:00 AM', type: 'lecture', location: 'Auditorium' },
    { title: 'Fee Payment Deadline', date: '2024-02-25', time: '05:00 PM', type: 'deadline', location: 'Finance Office' },
    { title: 'Sports Day', date: '2024-02-28', time: '08:00 AM', type: 'event', location: 'Sports Complex' },
  ] }) => {

  const typeColors = {
    exam: 'danger',
    meeting: 'primary',
    event: 'secondary',
    lecture: 'accent',
    deadline: 'warning',
  };

  const typeIcons = {
    exam: FileText,
    meeting: Users,
    event: Calendar,
    lecture: GraduationCap,
    deadline: AlertTriangle,
  };

  return (
    <Card>
      <Card.Header className="flex items-center justify-between">
        <div>
          <Card.Title>Upcoming Events</Card.Title>
          <Card.Description>Important dates and deadlines</Card.Description>
        </div>
        <Button variant="ghost" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Event
        </Button>
      </Card.Header>
      <Card.Content>
        <div className="space-y-3">
          {events.map((event, index) => {
            const Icon = typeIcons[event.type];
            const color = typeColors[event.type];
            return (
              <div 
                key={index}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-hover transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', `bg-${color}/10 text-${color}`)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary">{event.title}</p>
                  <p className="text-sm text-text-secondary flex items-center gap-2">
                    <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <span>{event.time}</span>
                    <span>•</span>
                    <span>{event.location}</span>
                  </p>
                </div>
                <Badge variant={color} size="sm">{event.type}</Badge>
              </div>
            );
          })}
        </div>
      </Card.Content>
    </Card>
  );
};

const StudentTable = ({ students = [] }) => {
  const columns = [
    { key: 'id', header: 'ID', width: '80px' },
    { key: 'name', header: 'Student', render: (val, row) => (
      <div className="flex items-center gap-3">
        <div className="avatar avatar-sm bg-primary/10 text-primary">{row.name.charAt(0)}</div>
        <div>
          <p className="font-medium text-text-primary">{row.name}</p>
          <p className="text-xs text-text-secondary">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'program', header: 'Program' },
    { key: 'year', header: 'Year', align: 'center', render: (val) => `${val}${val === 1 ? 'st' : val === 2 ? 'nd' : val === 3 ? 'rd' : 'th'}` },
    { key: 'status', header: 'Status', render: (val) => <Badge variant={val}>{val}</Badge> },
    { key: 'cgpa', header: 'CGPA', align: 'center', render: (val) => (
      <span className="font-mono tabular-nums">{typeof val === 'number' ? val.toFixed(2) : val}</span>
    )},
  ];

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1.5">
      <button className="p-2 rounded-xl text-text-secondary hover:bg-hover hover:text-text-primary transition-colors" title="View">
        <Eye className="w-4 h-4" />
      </button>
      <button className="p-2 rounded-xl text-text-secondary hover:bg-hover hover:text-primary transition-colors" title="Edit">
        <Edit className="w-4 h-4" />
      </button>
      <button className="p-2 rounded-xl text-text-secondary hover:bg-hover hover:text-danger transition-colors" title="Delete">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <Card>
      <Card.Header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Card.Title>Recent Students</Card.Title>
          <Card.Description>Latest enrollments and student records</Card.Description>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </Button>
          <Link
            to="/students"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Student
          </Link>
        </div>
      </Card.Header>
      <Card.Content>
        {students.length === 0 ? (
          <p className="text-sm text-text-secondary">No students found in the database.</p>
        ) : (
        <Table
          columns={columns}
          data={students}
          keyField="id"
          searchable
          paginated
          pageSize={5}
          actions={actions}
          hoverable
          striped
        />
        )}
      </Card.Content>
    </Card>
  );
};

const Dashboard = () => {
  const { success } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [fees, setFees] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [exams, setExams] = useState([]);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, f, c, fe, e, ex] = await Promise.all([
          api.get('/students'),
          api.get('/faculty'),
          api.get('/courses'),
          api.get('/fees'),
          api.get('/enrollments'),
          api.get('/exams'),
        ]);
        setStudents(s.data || []);
        setFaculty(f.data || []);
        setCourses(c.data || []);
        setFees(fe.data || []);
        setEnrollments(e.data || []);
        setExams(ex.data || []);
        setRevenue((fe.data || []).reduce((sum, fee) => sum + (Number(fee.paid) || 0), 0));
      } catch (err) {
        // Keep empty lists; UI shows empty states.
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    { title: 'Total Students', value: students.length, change: '', icon: Users, iconBg: 'bg-primary', trend: 'up', delay: 0 },
    { title: 'Total Faculty', value: faculty.length, change: '', icon: GraduationCap, iconBg: 'bg-secondary', trend: 'up', delay: 100 },
    { title: 'Active Courses', value: courses.length, change: '', icon: BookOpen, iconBg: 'bg-accent', trend: 'up', delay: 200 },
    { title: 'Total Revenue', value: formatCurrency(revenue), change: '', icon: DollarSign, iconBg: 'bg-success', trend: 'up', delay: 300 },
    { title: 'Enrollments', value: enrollments.length, change: '', icon: CheckCircle, iconBg: 'bg-info', trend: 'up', delay: 400 },
    { title: 'Upcoming Exams', value: exams.filter((x) => x.status === 'scheduled').length, change: '', icon: FileText, iconBg: 'bg-warning', trend: 'up', delay: 500 },
  ];

  const activities = [
    ...enrollments.slice(0, 3).map((e) => ({
      title: 'New Enrollment',
      desc: `${e.student} enrolled in ${e.course}`,
      time: e.enrollmentDate || 'recent',
      icon: UserPlus,
      color: 'primary',
    })),
    ...fees.filter((f) => f.status === 'paid').slice(0, 2).map((f) => ({
      title: 'Fee Payment',
      desc: `${f.student} paid ${formatCurrency(Number(f.paid) || 0)}`,
      time: f.paidDate || 'recent',
      icon: Mail,
      color: 'success',
    })),
    ...exams.filter((x) => x.status === 'scheduled').slice(0, 2).map((x) => ({
      title: 'Exam Scheduled',
      desc: `${x.name} (${x.course}) on ${x.date || 'TBD'}`,
      time: x.date || 'TBD',
      icon: Calendar,
      color: 'secondary',
    })),
  ];

  const enrollmentData = [65, 78, 92, 85, 105, 120, 135, 142, 158, 165, 172, 180];
  const revenueData = [180, 220, 195, 250, 280, 310, 290, 340, 380, 410, 450, 480];
  const attendanceData = [82, 85, 83, 87, 89, 86, 88, 90, 89, 91, 92, 90];

  return (
    <div className="space-y-6 animate-page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">Overview of your university metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            New Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Enrollment Trends</Card.Title>
            <Card.Description>Student enrollment over the past 12 months</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="h-72">
              <MiniChart data={enrollmentData} color="var(--accent-blue)" height={280} />
            </div>
          </Card.Content>
        </Card>

        <Card className="dark-card">
          <Card.Header>
            <Card.Title className="text-white">Revenue Overview</Card.Title>
            <Card.Description className="text-white/60">Monthly revenue in thousands</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="h-72">
              <MiniChart data={revenueData} color="var(--accent-green)" height={280} />
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={activities} />
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEvents events={exams.filter((x) => x.status === 'scheduled').map((x) => ({
          title: x.name,
          date: x.date || 'TBD',
          time: x.startTime || 'TBD',
          type: 'exam',
          location: x.location || 'TBD',
        }))} />
        <StudentTable students={students.slice(0, 10)} />
      </div>
    </div>
  );
};

export default Dashboard;
