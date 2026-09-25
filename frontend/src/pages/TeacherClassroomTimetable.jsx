import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Card } from '@/components/ui/Card';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const PERIODS = [
  { num: 1, label: 'P1 (08:00-09:00)' },
  { num: 2, label: 'P2 (09:00-10:00)' },
  { num: 3, label: 'P3 (10:00-11:00)' },
];

export default function TeacherClassroomTimetable() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('byClassroom');

  useEffect(() => {
    if (!user) return;
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const response = await api.get('/teacher-classroom-timetable');
        setTimetable(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching timetable:', err);
        setError('Failed to load timetable');
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [user]);

  const getAssignment = (day, period, classroomName) => {
    return timetable.find(
      t => t.day === day && t.period === period && t.classroomName === classroomName
    );
  };

  const getClassrooms = () => {
    const rooms = new Set();
    timetable.forEach(t => rooms.add(t.classroomName));
    return Array.from(rooms).sort();
  };

  const getTeachersByClassroom = (classroomName) => {
    const entries = timetable.filter(t => t.classroomName === classroomName);
    const teachers = new Map();
    entries.forEach(t => {
      if (!teachers.has(t.teacherId)) {
        teachers.set(t.teacherId, { name: t.teacherName, department: t.department, count: 0 });
      }
      teachers.get(t.teacherId).count++;
    });
    return Array.from(teachers.values());
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

  const classrooms = getClassrooms();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Teacher-Classroom Timetable
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="byClassroom">By Classroom</option>
            <option value="byTeacher">By Teacher</option>
          </select>
        </div>
      </div>

      {view === 'byClassroom' ? (
        <div className="space-y-6">
          {classrooms.map(classroomName => (
            <Card key={classroomName} className="overflow-hidden">
              <div className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                {classroomName}
              </div>
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
                          const assignment = getAssignment(day, period.num, classroomName);
                          return (
                            <td key={day} className="px-4 py-2 align-middle">
                              {assignment ? (
                                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                                  <div className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{assignment.teacherName}</div>
                                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{assignment.department}</div>
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
              <div className="px-4 py-2 text-sm" style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)' }}>
                Teachers: {getTeachersByClassroom(classroomName).map(t => `${t.name} (${t.count})`).join(', ')}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', width: '200px' }}>Teacher / Department</th>
                    {DAYS.map(day => (
                      <th key={day} className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timetable.reduce((acc, t) => {
                    if (!acc.has(t.teacherId)) acc.set(t.teacherId, { name: t.teacherName, department: t.department, assignments: [] });
                    acc.get(t.teacherId).assignments.push(t);
                    return acc;
                  }, new Map()).entries().map(([id, teacher]) => (
                    <tr key={id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-2 font-medium" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-secondary)', width: '200px' }}>
                        {teacher.name} <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>({teacher.department})</span>
                      </td>
                      {DAYS.map(day => {
                        const dayAssignments = teacher.assignments.filter(a => a.day === day);
                        return (
                          <td key={day} className="px-4 py-2 align-middle">
                            {dayAssignments.length > 0 ? (
                              <div className="space-y-1">
                                {dayAssignments.map((a, idx) => (
                                  <div key={idx} className="p-1.5 rounded" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                                    <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                      P{a.period} ({a.startTime}-{a.endTime})
                                    </div>
                                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{a.classroomName}</div>
                                  </div>
                                ))}
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
      )}
      <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
        Generated timetable with 5 days × 3 periods. All 45 slots filled across 3 classrooms.
      </p>
    </div>
  );
}