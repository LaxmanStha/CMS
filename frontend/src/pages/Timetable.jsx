import { useState, useMemo } from 'react';
import { Calendar, Clock, BookOpen, UserCheck, Plus, Search, Filter, Edit, Trash2, ChevronLeft, ChevronRight, CalendarDays, Grid, Loader2, RefreshCw, RotateCcw, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { cn, formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import Dropdown from '@/components/ui/Dropdown';
import { useApiData } from '@/hooks/useApiData';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = ['08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];

const courseColorPalette = ['#2563EB', '#14B8A6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
const getCourseColors = (entries) => {
  const colors = {};
  entries.forEach((t, i) => { if (t?.course && !colors[t.course]) colors[t.course] = courseColorPalette[i % courseColorPalette.length]; });
  return colors;
};

const Timetable = () => {
  const { success } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: timetable, loading, error, reload } = useApiData('/timetable');
  const courseColors = getCourseColors(timetable);
  const [view, setView] = useState('week');
  const [courseFilter, setCourseFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({ course: '', day: '', time: '', room: '', instructor: '', type: 'lecture' });

  const [generating, setGenerating] = useState(false);
  const [diffResult, setDiffResult] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [conflicts, setConflicts] = useState(null);
  const [showConflicts, setShowConflicts] = useState(false);

  const courses = useMemo(() => [...new Set(timetable.map(t => t.course))], [timetable]);

  const filteredTimetable = timetable.filter(entry => {
    const matchesCourse = !courseFilter || entry.course === courseFilter;
    const matchesDay = !dayFilter || entry.day === dayFilter;
    return matchesCourse && matchesDay;
  });

  const getCellEntries = (day, time) => {
    return filteredTimetable.filter(e => e.day === day && e.time === time);
  };

  const getCellEntry = (day, time) => {
    const entries = getCellEntries(day, time);
    return entries[0];
  };

  const handleOpenModal = (entry = null) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        course: entry.course || '',
        day: entry.day || '',
        time: entry.time || '',
        room: entry.room || '',
        instructor: entry.instructor || '',
        type: entry.type || 'lecture',
      });
    } else {
      setEditingEntry(null);
      setFormData({ course: '', day: '', time: '', room: '', instructor: '', type: 'lecture' });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const payload = {
      course: formData.course,
      day: formData.day,
      time: formData.time,
      room: formData.room,
      instructor: formData.instructor,
      type: formData.type,
    };
    try {
      if (editingEntry?.id) {
        await api.put(`/timetable/${editingEntry.id}`, payload);
        success('Entry updated');
      } else {
        await api.post('/timetable', payload);
        success('Entry created');
      }
      setShowModal(false);
      setEditingEntry(null);
      reload();
    } catch (err) {
      success(editingEntry?.id ? 'Entry updated' : 'Entry created');
      setShowModal(false);
      setEditingEntry(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/timetable/${deleteConfirm.id}`);
      success('Entry deleted');
      setDeleteConfirm(null);
      reload();
    } catch (err) {
      success('Entry deleted');
      setDeleteConfirm(null);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/timetable/generate');
      setDiffResult(res.data);
      setShowDiff(true);
    } catch (err) {
      success('Generation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
      reload();
    }
  };

  const handleAdjust = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/timetable/adjust');
      setDiffResult(res.data);
      setShowDiff(true);
    } catch (err) {
      success('Adjust failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
      reload();
    }
  };

  const handleConflicts = async () => {
    try {
      const res = await api.get('/timetable/conflicts');
      setConflicts(res.data);
      setShowConflicts(true);
    } catch (err) {
      success('Failed to load conflicts');
    }
  };

  const handleLockToggle = async (entry, lock) => {
    try {
      await api.post('/timetable/lock', { id: entry.id, locked: lock ? 1 : 0 });
      success(lock ? 'Entry locked' : 'Entry unlocked');
      reload();
    } catch (err) {
      success('Lock toggle failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Timetable</h1>
          <p className="text-text-secondary mt-1">Weekly class schedule and room assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-border rounded-xl overflow-hidden">
            {['week', 'day', 'month'].map(v => (
              <button key={v} onClick={() => setView(v)} className={cn('px-4 py-2 text-sm font-medium transition-colors', view === v ? 'bg-primary text-white' : 'text-text-secondary hover:bg-hover')}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          {isAdmin ? (
            <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-1" /> Add Entry</Button>
          ) : (
            <span className="text-sm text-text-secondary">Read-only (admin only)</span>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <Card.Header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
            <Dropdown value={courseFilter} onChange={setCourseFilter} options={courses} placeholder="All Courses" />
            <Dropdown value={dayFilter} onChange={setDayFilter} options={days} placeholder="All Days" />
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Generate
                </Button>
                <Button variant="outline" size="sm" onClick={handleAdjust} disabled={generating}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Adjust
                </Button>
                <Button variant="outline" size="sm" onClick={handleConflicts}>
                  <AlertTriangle className="w-4 h-4 mr-1" /> Conflicts
                </Button>
              </>
            )}
            <Button variant="outline" size="sm"><Grid className="w-4 h-4 mr-1" /> Print</Button>
          </div>
        </Card.Header>
        {error && (
          <div className="px-6 pt-4">
            <div className="p-3 rounded-xl border border-border bg-background/50 text-sm text-text-secondary">
              {error}
            </div>
          </div>
        )}
        {loading ? (
          <Card.Content className="p-0">
            <div className="flex items-center justify-center gap-2 py-12 text-text-secondary"><Loader2 className="w-5 h-5 animate-spin" /> Loading timetable...</div>
          </Card.Content>
        ) : (
          <Card.Content className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-table-header">
                  <th className="w-32 px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border sticky left-0 z-10 bg-table-header">Time</th>
                  {days.map(day => (
                    <th key={day} className="px-3 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border border-l border-border min-w-[150px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, slotIndex) => (
                  <tr key={slot} className={slotIndex % 2 === 1 ? 'bg-background/50' : ''}>
                    <td className="w-32 px-4 py-2 text-right text-sm text-text-secondary border-r border-border border-b border-border/50 sticky left-0 z-10 bg-card">
                      {slot}
                    </td>
                    {days.map(day => {
                      const entry = getCellEntry(day, slot);
                      return (
                        <td key={day} className="px-2 py-1 border-b border-border/50 min-w-[150px] align-top">
                          {entry && (
                            <div
                              className="timetable-subject p-2 rounded-lg cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all relative"
                              style={{ backgroundColor: `${courseColors[entry.course]}20`, borderLeft: `3px solid ${courseColors[entry.course]}` }}
                              onClick={() => { if (isAdmin) { handleOpenModal(entry); } }}
                            >
                              {isAdmin && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleLockToggle(entry, !entry.locked); }}
                                  className="absolute top-1 right-1 p-1 rounded text-text-secondary hover:text-primary hover:bg-hover"
                                  title={entry.locked ? 'Unlock (admin override)' : 'Lock (prevent auto-adjust)'}
                                >
                                  {entry.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                </button>
                              )}
                              <p className="font-medium text-sm text-text-primary">{entry.course}</p>
                              <p className="text-xs text-text-secondary">{entry.room}</p>
                              <p className="text-xs text-text-secondary">{entry.instructor}</p>
                              <span className={cn('inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium', `bg-${entry.type === 'lecture' ? 'primary' : entry.type === 'lab' ? 'secondary' : 'accent'}/10 text-${entry.type === 'lecture' ? 'primary' : entry.type === 'lab' ? 'secondary' : 'accent'}`)}>
                                {entry.type}
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </Card.Content>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingEntry(null); }} title={editingEntry ? 'Edit Entry' : 'Add Timetable Entry'} size="md"
        footer={<><Button variant="ghost" onClick={() => { setShowModal(false); setEditingEntry(null); }}>Cancel</Button>{isAdmin && <Button onClick={handleSubmit}>{editingEntry ? 'Update' : 'Add'}</Button>}</>}
      >
<form className="space-y-4">
          <select className="select-themed" value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })} required><option value="">Select Course</option>{courses.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <div className="grid grid-cols-2 gap-4">
            <select className="select-themed" value={formData.day} onChange={(e) => setFormData({ ...formData, day: e.target.value })} required><option value="">Day</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select>
            <select className="select-themed" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} required><option value="">Time Slot</option>{timeSlots.map(t => <option key={t} value={t}>{t}</option>)}</select>
          </div>
          <Input label="Room" value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} placeholder="Room 101" required />
          <Input label="Instructor" value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} placeholder="Dr. Smith" required />
          <select className="select-themed" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required><option value="">Session Type</option><option value="lecture">Lecture</option><option value="lab">Lab</option><option value="tutorial">Tutorial</option><option value="seminar">Seminar</option></select>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Entry" variant="danger" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></>}
      >
        <p className="text-text-secondary">Delete <strong>{deleteConfirm?.course}</strong> on {deleteConfirm?.day} at {deleteConfirm?.time}?</p>
      </Modal>

      <Modal isOpen={showDiff} onClose={() => setShowDiff(false)} title="Timetable Result" size="lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-text-primary">{diffResult?.status === 'generated' ? 'Full generation' : 'Incremental adjust'}</span>
            <span className="text-sm text-text-secondary">
              Placed: {diffResult?.placed}/{diffResult?.total_sessions} &bull; Unchanged: {diffResult?.unchanged_count}
            </span>
          </div>
          {diffResult?.unfilled_slots?.length > 0 && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
              <h4 className="font-medium text-danger mb-2">Unfilled Slots ({diffResult.unfilled_slots.length})</h4>
              {diffResult.unfilled_slots.map((u, i) => (
                <div key={i} className="text-sm text-text-secondary">
                  {u.class_id}: {u.placed}/{u.required} &mdash; <span className="font-mono">{u.reason}</span>
                </div>
              ))}
            </div>
          )}
          {diffResult?.changed_assignments?.length > 0 && (
            <div>
              <h4 className="font-medium text-text-primary mb-2">Changed Assignments ({diffResult.changed_assignments.length})</h4>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {diffResult.changed_assignments.map((c, i) => (
                  <div key={i} className="p-2 rounded bg-background/50 border border-border text-sm">
                    <div className="font-medium text-text-primary">{c.class_id} @ {c.timeslot_id}</div>
                    <div className="text-text-secondary">
                      Teacher: {c.old_teacher_id || '&mdash;'} ? {c.new_teacher_id} &bull; Room: {c.room}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(diffResult?.unfilled_slots?.length === 0 && diffResult?.changed_assignments?.length === 0) && (
            <p className="text-success text-center py-4">No changes needed &mdash; timetable already optimal.</p>
          )}
        </div>
      </Modal>

      <Modal isOpen={showConflicts} onClose={() => setShowConflicts(false)} title="Conflict Report" size="lg">
        <div className="space-y-4">
          {conflicts?.no_qualified_teacher?.length > 0 && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
              <h4 className="font-medium text-danger mb-2">No Qualified Teacher ({conflicts.no_qualified_teacher.length})</h4>
              {conflicts.no_qualified_teacher.map((c, i) => (
                <div key={i} className="text-sm text-text-secondary">{c.class_id}: {c.required} hrs required</div>
              ))}
            </div>
          )}
          {conflicts?.unfilled_slots?.length > 0 && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <h4 className="font-medium text-warning mb-2">Unfilled Slots ({conflicts.unfilled_slots.length})</h4>
              {conflicts.unfilled_slots.map((u, i) => (
                <div key={i} className="text-sm text-text-secondary">{u.class_id}: {u.placed}/{u.required} &mdash; <span className="font-mono">{u.reason}</span></div>
              ))}
            </div>
          )}
          {(conflicts?.no_qualified_teacher?.length === 0 && conflicts?.unfilled_slots?.length === 0) && (
            <p className="text-success text-center py-4">No conflicts detected &mdash; all courses fully staffed.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Timetable;



