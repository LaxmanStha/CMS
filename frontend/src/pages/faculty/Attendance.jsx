import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { cn, formatDate } from '@/lib/utils';

const statusOptions = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
];

const FacultyAttendance = () => {
  const { success, error } = useToast();
  const { user } = useAuth();

  const [classrooms, setClassrooms] = useState([]);
  const [classroomsLoading, setClassroomsLoading] = useState(true);
  const [classroomsError, setClassroomsError] = useState('');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [classroomStudents, setClassroomStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [rosterStatus, setRosterStatus] = useState({});
  const [rosterNotes, setRosterNotes] = useState({});
  const [savingRoster, setSavingRoster] = useState(false);

  useEffect(() => {
    const loadMeta = async () => {
      setClassroomsLoading(true);
      setClassroomsError('');
      try {
        const crRes = await api.get(`/teachers/${user?.id}/classrooms`);
        const crRows = Array.isArray(crRes.data) ? crRes.data : [];
        setClassrooms(crRows);
      } catch {
        setClassrooms([]);
        setClassroomsError('Unable to load rooms');
      } finally {
        setClassroomsLoading(false);
      }
    };
    if (user?.id) loadMeta();
  }, [user?.id]);

  useEffect(() => {
    const load = async () => {
      if (!selectedClassroomId) {
        setClassroomStudents([]);
        setRosterStatus({});
        setRosterNotes({});
        return;
      }
      setStudentsLoading(true);
      try {
        const [stRes, attRes] = await Promise.all([
          api.get(`/classrooms/${selectedClassroomId}/students`),
          api.get(`/classroom/${selectedClassroomId}/attendance?date=${selectedDate}`),
        ]);
        const students = Array.isArray(stRes.data) ? stRes.data : [];
        setClassroomStudents(students);
        const attendance = Array.isArray(attRes.data) ? attRes.data : [];
        const statusMap = {};
        const notesMap = {};
        attendance.forEach(a => {
          if (a.studentId) {
            statusMap[String(a.studentId)] = a.status || 'present';
            notesMap[String(a.studentId)] = a.notes || '';
          }
        });
        setRosterStatus(statusMap);
        setRosterNotes(notesMap);
      } catch {
        setClassroomStudents([]);
        setRosterStatus({});
        setRosterNotes({});
      } finally {
        setStudentsLoading(false);
      }
    };
    load();
  }, [selectedClassroomId, selectedDate]);

  const classroomOptions = useMemo(
    () => {
      const seenRooms = new Set();
      return classrooms.reduce((options, classroom) => {
        const roomNumber = String(classroom.room_number || '').trim();
        if (!roomNumber || seenRooms.has(roomNumber)) return options;
        seenRooms.add(roomNumber);
        options.push({ value: String(classroom.id), label: roomNumber });
        return options;
      }, []);
    },
    [classrooms]
  );

  const selectedClassroom = useMemo(
    () => classrooms.find(c => String(c.id) === String(selectedClassroomId)) || null,
    [classrooms, selectedClassroomId]
  );

  const setStudentStatus = (sid, status) =>
    setRosterStatus(prev => ({ ...prev, [sid]: status }));
  const setStudentNotes = (sid, notes) =>
    setRosterNotes(prev => ({ ...prev, [sid]: notes }));

  const saveRoster = async () => {
    if (!selectedClassroomId) { error('Please select a classroom'); return; }
    setSavingRoster(true);
    try {
      const records = classroomStudents.map(s => ({
        studentId: s.id,
        student: s.name,
        status: rosterStatus[String(s.id)] || 'present',
        notes: rosterNotes[String(s.id)] || '',
      }));
      await api.post(`/classroom/${selectedClassroomId}/attendance`, {
        teacherId: user.id,
        date: selectedDate,
        time: new Date().toTimeString().slice(0, 5),
        records,
      });
      success('Attendance saved');
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Failed to save attendance');
    } finally {
      setSavingRoster(false);
    }
  };

  const presentCount = classroomStudents.filter(
    s => (rosterStatus[String(s.id)] || 'present') === 'present'
  ).length;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Session</h3>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {selectedClassroomId
                ? `${selectedClassroom?.name || 'Class'} · ${selectedClassroom?.room_number || ''}`.trim()
                : 'No classroom selected'}
              {' '}· {formatDate(selectedDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <div className="flex-1 min-w-0">
            <label className="label">Classroom</label>
            <Dropdown
              value={selectedClassroomId}
              onChange={setSelectedClassroomId}
              options={classroomOptions}
              placeholder={classroomsLoading ? 'Loading rooms...' : classroomsError ? classroomsError : classroomOptions.length ? 'Select Room Number' : 'No rooms available'}
              disabled={classroomsLoading || !!classroomsError}
              className="w-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <Input
              label="Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-date w-full"
            />
          </div>
        </div>

        {!selectedClassroomId ? (
          <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--color-text-muted)' }}>
            <p className="text-sm font-medium">Select a classroom to view students</p>
            <p className="text-xs mt-1">You need to choose a classroom before marking attendance.</p>
          </div>
        ) : studentsLoading ? (
          <div className="flex items-center gap-2 py-8" style={{ color: 'var(--color-text-muted)' }}>
            <Loader2 className="w-5 h-5 animate-spin" /> Loading students...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
              <table className="w-full min-w-[720px] text-sm">
                <thead style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">Student</th>
                    <th className="text-left font-medium px-4 py-2.5 w-44">Status</th>
                    <th className="text-left font-medium px-4 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {classroomStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
                        No students enrolled
                      </td>
                    </tr>
                  ) : classroomStudents.map(s => (
                    <tr key={s.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td className="w-44 min-w-44 px-4 py-2.5">
                        <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{s.name}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.id}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Dropdown
                          value={rosterStatus[String(s.id)] || 'present'}
                          onChange={(val) => setStudentStatus(String(s.id), val)}
                          options={statusOptions}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <Input
                          value={rosterNotes[String(s.id)] || ''}
                          onChange={(e) => setStudentNotes(String(s.id), e.target.value)}
                          placeholder="Optional notes..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={cn(
              'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5'
            )}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {presentCount} of {classroomStudents.length} marked present.
              </p>
              <Button onClick={saveRoster} disabled={savingRoster}>
                {savingRoster ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <CalendarCheck className="w-4 h-4 mr-1.5" />
                )}
                Save Attendance
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default FacultyAttendance;