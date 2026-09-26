import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Card } from '@/components/ui/Card';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const PERIODS = [
  { num: 1, label: 'P1 (08:00-09:00)' },
  { num: 2, label: 'P2 (09:00-10:00)' },
  { num: 3, label: 'P3 (10:00-11:00)' },
];

export default function StudentTimetable() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTimetable = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/timetable/generated', {
        params: { student_id: user.id }
      });
      setTimetable(res.data);
    } catch (e) {
      console.error('Error fetching timetable:', e);
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [user.id]);

  const getAssignment = (day, period) => {
    return timetable.find(t => t.day === day && t.period === period);
  };

  if (loading) return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
          <span className="ml-2" style={{ color: 'var(--color-text-muted)' }}>Loading timetable...</span>
        </div>
      </Card>
    </div>
  );

  if (error) return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-center py-12" style={{ color: 'var(--color-danger)' }}>
          {error}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          My Timetable
        </h2>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', width: '140px' }}>Period / Day</th>
                {DAYS.map(day => (
                  <th key={day} className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(period => (
                <tr key={period.num} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-2 font-medium" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-secondary)', width: '140px' }}>{period.label}</td>
                  {DAYS.map(day => {
                    const assignment = getAssignment(day, period.num);
                    return (
                      <td key={day} className="px-4 py-2 align-middle">
                        {assignment ? (
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                            <div className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{assignment.teacherName}</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{assignment.department}</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{assignment.classroomName}</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{assignment.startTime}-{assignment.endTime}</div>
                          </div>
                        ) : (
                          <div className="text-center py-2" style={{ color: 'var(--color-text-muted)' }}>Free</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}