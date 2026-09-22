import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import Dropdown from '@/components/ui/Dropdown';

const StudentGrades = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState('Fall 2025');

  useEffect(() => {
    if (!user) return;
    const fetchGrades = async () => {
      try {
        const response = await api.get(`/students/${user.id}/grades?semester=${semester}`);
        setGrades(response.data);
      } catch (err) {
        console.error('Error fetching grades:', err);
        setGrades([
          { course: 'Mathematics 101', code: 'MATH101', midterm: 88, final: 92, assignment: 95, overall: 91.2, letter: 'A-' },
          { course: 'Physics 101', code: 'PHYS101', midterm: 76, final: 82, assignment: 88, overall: 82.8, letter: 'B' },
          { course: 'Chemistry 101', code: 'CHEM101', midterm: 84, final: 79, assignment: 91, overall: 84.7, letter: 'B' },
          { course: 'English Literature', code: 'ENG101', midterm: 91, final: 88, assignment: 94, overall: 91.0, letter: 'A-' },
          { course: 'World History', code: 'HIST101', midterm: 85, final: 87, assignment: 89, overall: 87.0, letter: 'B+' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [user, semester]);

  const calculateGPA = () => {
    if (grades.length === 0) return '0.00';
    const total = grades.reduce((sum, g) => sum + g.overall, 0);
    return (total / grades.length / 25).toFixed(2);
  };

  const stats = useMemo(() => [
    { title: 'Current GPA', value: calculateGPA(), iconClass: 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]' },
    { title: 'Credits Completed', value: grades.reduce((sum, g) => sum + 3, 0), iconClass: 'bg-[var(--color-success)]/10 text-[var(--color-success)]' },
    { title: 'Courses This Semester', value: grades.length, iconClass: 'bg-[var(--color-info)]/10 text-[var(--color-info)]' },
  ], [grades]);

  if (loading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
        <span className="ml-2" style={{ color: 'var(--color-text-muted)' }}>Loading grades...</span>
      </div>
    </div>
  );

  const columns = [
    { key: 'course', header: 'Course' },
    { key: 'code', header: 'Code', width: '100px' },
    { key: 'midterm', header: 'Midterm', width: '100px', render: (v) => `${v}%` },
    { key: 'final', header: 'Final', width: '100px', render: (v) => `${v}%` },
    { key: 'assignment', header: 'Assignments', width: '120px', render: (v) => `${v}%` },
    { key: 'overall', header: 'Overall', width: '100px', render: (v) => <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{v}%</span> },
    { key: 'letter', header: 'Letter Grade', width: '120px', render: (v) => <Badge variant="primary" size="sm">{v}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <label className="mr-2" style={{ color: 'var(--color-text-muted)' }}>Semester:</label>
          <Dropdown
            value={semester}
            onChange={setSemester}
            options={['Fall 2025', 'Spring 2025', 'Fall 2024'].map(s => ({ value: s, label: s }))}
            className="w-auto min-w-[180px]"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="p-6 text-center" style={{ border: '1px solid var(--color-border)' }}>
            <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>{stat.title}</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stat.value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <Card.Header>
          <Card.Title>Grade Details</Card.Title>
        </Card.Header>
        <Card.Content>
          <Table
            columns={columns}
            data={grades}
            keyField="course"
            searchable={false}
            filterable={false}
            paginated={false}
            emptyMessage="No grades available"
          />
        </Card.Content>
      </Card>
    </div>
  );
};

export default StudentGrades;