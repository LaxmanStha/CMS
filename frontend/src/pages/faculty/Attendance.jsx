import { useState, useEffect, useMemo } from 'react';
import { CalendarCheck, Users, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Take Attendance</h1>
        <p className="text-text-secondary mt-1">
          Pick a classroom and date, then mark each student.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Session</h3>
            <p className="text-xs text-text-secondary">
              {selectedClassroomId
                ? `${selectedClassroom?.section_name || 'Class'} · ${selectedClassroom?.room_number || ''}`.trim()
                : 'No classroom selected'}
              {' '}· {formatDate(selectedDate)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Select
            label="Classroom"
            value={selectedClassroomId}
            onChange={setSelectedClassroomId}
            options={classroomOptions}
            placeholder={classroomsLoading ? 'Loading rooms...' : classroomsError ? classroomsError : classroomOptions.length ? 'Select Room Number' : 'No rooms available'}
            disabled={classroomsLoading || !!classroomsError}
          />
          <Input
            label="Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {!selectedClassroomId ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
            <Users className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">Select a classroom to view students</p>
            <p className="text-xs mt-1">You need to choose a classroom before marking attendance.</p>
          </div>
        ) : studentsLoading ? (
          <div className="flex items-center gap-2 py-8 text-text-secondary">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading students
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-background/60 text-text-secondary">
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">Student</th>
                    <th className="text-left font-medium px-4 py-2.5 w-44">Status</th>
                    <th className="text-left font-medium px-4 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {classroomStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-text-tertiary">
                        No students enrolled
                      </td>
                    </tr>
                  ) : classroomStudents.map(s => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-text-primary">{s.name}</div>
                        <div className="text-xs text-text-tertiary">{s.id}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Select
                          value={rosterStatus[String(s.id)] || 'present'}
                          onChange={(val) => setStudentStatus(String(s.id), val)}
                          options={statusOptions}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <Input
                          value={rosterNotes[String(s.id)] || ''}
                          onChange={(e) => setStudentNotes(String(s.id), e.target.value)}
                          placeholder="Optional notes"
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
              <p className="text-xs text-text-tertiary">
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
