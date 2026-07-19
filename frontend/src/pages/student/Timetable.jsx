import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';

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

  if (loading) return <div className="container-fluid p-4"><div className="alert alert-info">Loading timetable...</div></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Timetable</h2>
        <div>
          <label className="me-2">Week:</label>
          <select className="form-select form-select-sm d-inline-block w-auto" value={week} onChange={e => setWeek(e.target.value)}>
            <option value="Week 1">Week 1</option>
            <option value="Week 2">Week 2</option>
            <option value="Week 3">Week 3</option>
            <option value="Week 4">Week 4</option>
          </select>
        </div>
      </div>
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered mb-0">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: '100px' }}>Time / Day</th>
                  {days.map(day => (
                    <th key={day} className="text-center">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time}>
                    <td className="fw-bold table-active">{time}</td>
                    {days.map(day => {
                      const cls = getClassAt(day, time);
                      return (
                        <td key={day} className="align-middle">
                          {cls ? (
                            <div className="p-2 bg-light border rounded">
                              <div className="fw-bold small">{cls.course}</div>
                              <div className="text-muted small">{cls.room}</div>
                              <div className="text-muted small">{cls.faculty}</div>
                            </div>
                          ) : (
                            <div className="text-muted small text-center py-3">Free</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <small className="text-muted">* Timetable is subject to change. Please check regularly for updates.</small>
      </div>
    </div>
  );
};

export default StudentTimetable;

