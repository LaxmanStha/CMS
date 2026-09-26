import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Card } from '@/components/ui/Card';
import Dropdown from '@/components/ui/Dropdown';
import { cn } from '@/lib/utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const PERIODS = [
  { num: 1, label: 'P1 (08:00-09:00)' },
  { num: 2, label: 'P2 (09:00-10:00)' },
  { num: 3, label: 'P3 (10:00-11:00)' },
];

export default function Timetable() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('byClass');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [timetable, setTimetable] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isTeacher = user?.role === 'teacher' || user?.role === 'faculty';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classrooms');
      setClasses(res.data);
    } catch (e) {
      console.error('Failed to load classes:', e);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data);
    } catch (e) {
      console.error('Failed to load teachers:', e);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/timetable/generated';
      const params = new URLSearchParams();
      
      if (viewMode === 'byClass' && selectedClass) {
        params.append('classroom_id', selectedClass);
      } else if (viewMode === 'byTeacher' && selectedTeacher) {
        params.append('teacher_id', selectedTeacher);
      } else if (isTeacher) {
        params.append('teacher_id', user.id);
      } else if (isStudent) {
        params.append('student_id', user.id);
      }
      
      if (params.toString()) url += '?' + params.toString();
      
      const res = await api.get(url);
      setTimetable(res.data);
    } catch (e) {
      console.error('Error fetching timetable:', e);
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'byClass' && selectedClass) {
      fetchTimetable();
    } else if (viewMode === 'byTeacher' && selectedTeacher) {
      fetchTimetable();
    } else if (isTeacher || isStudent) {
      fetchTimetable();
    } else {
      setTimetable([]);
    }
  }, [viewMode, selectedClass, selectedTeacher]);

  const getAssignment = (day, period, classroomId) => {
    return timetable.find(t => t.day === day && t.period === period && t.classroomId === classroomId);
  };

  const getTeacherAssignment = (day, period) => {
    return timetable.find(t => t.day === day && t.period === period);
  };

  const classrooms = useMemo(() => {
    const rooms = new Map();
    timetable.forEach(t => {
      if (!rooms.has(t.classroomId)) {
        rooms.set(t.classroomId, { id: t.classroomId, name: t.classroomName });
      }
    });
    return Array.from(rooms.values());
  }, [timetable]);

  const classOptions = classes.map(c => ({ value: c.id, label: c.name || c.room_number }));
  const teacherOptions = teachers.map(t => ({ value: t.id, label: t.name }));

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
          Timetable
        </h2>
        <div className="flex items-center gap-3">
          <Dropdown
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'byClass', label: 'By Class' },
              { value: 'byTeacher', label: 'By Teacher' }
            ]}
            className="w-auto min-w-[160px]"
          />
          {viewMode === 'byClass' && (
            <Dropdown
              value={selectedClass}
              onChange={setSelectedClass}
              options={[{ value: '', label: 'Select Class' }, ...classOptions]}
              placeholder="Select Class"
              className="w-auto min-w-[200px]"
            />
          )}
          {viewMode === 'byTeacher' && !isTeacher && (
            <Dropdown
              value={selectedTeacher}
              onChange={setSelectedTeacher}
              options={[{ value: '', label: 'Select Teacher' }, ...teacherOptions]}
              placeholder="Select Teacher"
              className="w-auto min-w-[200px]"
            />
          )}
        </div>
      </div>

      {classrooms.length > 0 ? (
        <div className="space-y-6">
          {classrooms.map(classroom => (
            <Card key={classroom.id} className="overflow-hidden">
              <div className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                {classroom.name}
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
                          const assignment = getAssignment(day, period.num, classroom.id);
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
            </Card>
          ))}
        </div>
      ) : (
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
      )}
      <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
        {viewMode === 'byClass' ? 'Timetable by Classroom' : 'Timetable by Teacher'}
      </p>
    </div>
  );
}