import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';
import { Card } from '@/components/ui/Card';
import Dropdown from '@/components/ui/Dropdown';
import { cn } from '@/lib/utils';

const StudentTimetable = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState('Week 1');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '8:00 - 9:00', '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
    '12:00 - 1:00', '1:00 - 2:00', '2:00 - 3:00', '3:00 - 4:00', '4:00 - 5:00'
  ];

  useEffect(() => {
    if (!user) return;
    const fetchTimetable = async () => {
      try {
        const response = await api.get(`/students/${user.id}/timetable?week=${week}`);
        setTimetable(response.data);
      } catch (err) {
        console.error('Error fetching timetable:', err);
        setTimetable([
          { day: 'Monday', time: '9:00 - 10:00', course: 'Mathematics 101', room: 'Room 101', faculty: 'Dr. Sarah Johnson' },
          { day: 'Monday', time: '11:00 - 12:00', course: 'Physics 101', room: 'Room 201', faculty: 'Prof. Michael Brown' },
          { day: 'Monday', time: '2:00 - 3:00', course: 'Chemistry 101', room: 'Lab 301', faculty: 'Dr. Emily Davis' },
          { day: 'Tuesday', time: '10:00 - 11:00', course: 'English Literature', room: 'Room 102', faculty: 'Prof. Robert Wilson' },
          { day: 'Tuesday', time: '1:00 - 2:00', course: 'World History', room: 'Room 202', faculty: 'Dr. Lisa Anderson' },
          { day: 'Wednesday', time: '9:00 - 10:00', course: 'Mathematics 101', room: 'Room 101', faculty: 'Dr. Sarah Johnson' },
          { day: 'Wednesday', time: '11:00 - 12:00', course: 'Physics 101', room: 'Room 201', faculty: 'Prof. Michael Brown' },
          { day: 'Wednesday', time: '2:00 - 3:00', course: 'Chemistry 101', room: 'Lab 301', faculty: 'Dr. Emily Davis' },
          { day: 'Thursday', time: '10:00 - 11:00', course: 'English Literature', room: 'Room 102', faculty: 'Prof. Robert Wilson' },
          { day: 'Thursday', time: '1:00 - 2:00', course: 'World History', room: 'Room 202', faculty: 'Dr. Lisa Anderson' },
          { day: 'Friday', time: '9:00 - 10:00', course: 'Mathematics 101', room: 'Room 101', faculty: 'Dr. Sarah Johnson' },
          { day: 'Friday', time: '11:00 - 12:00', course: 'Physics 101', room: 'Room 201', faculty: 'Prof. Michael Brown' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [user, week]);

  const getClassAt = (day, time) => {
    return timetable.find(c => c.day === day && c.time === time);
  };

  const weekOptions = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(w => ({ value: w, label: w }));

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Dropdown
            value={week}
            onChange={setWeek}
            options={weekOptions}
            className="w-auto min-w-[180px]"
          />
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', width: '100px' }}>Time / Day</th>
                {days.map(day => (
                  <th key={day} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-secondary)', width: '100px' }}>{time}</td>
                  {days.map(day => {
                    const cls = getClassAt(day, time);
                    return (
                      <td key={day} className="px-4 py-3 align-middle">
                        {cls ? (
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                            <div className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{cls.course}</div>
                            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{cls.room}</div>
                            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{cls.faculty}</div>
                          </div>
                        ) : (
                          <div className="text-center py-3" style={{ color: 'var(--color-text-muted)' }}>Free</div>
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
      <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>Timetable is subject to change. Please check regularly for updates.</p>
    </div>
  );
};

export default StudentTimetable;