import { useState } from 'react';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { useApiData } from '@/hooks/useApiData';

const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const periodOptions = [1, 2, 3, 4, 5, 6, 7, 8];

const Teachers = () => {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: faculty, reload } = useApiData('/faculty');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    max_hours_per_week: 20,
    subjects: [],
    unavailable_slots: [],
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const courseList = [];

  const toggleSubject = (code) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(code)
        ? prev.subjects.filter(c => c !== code)
        : [...prev.subjects, code],
    }));
  };

  const toggleUnavailable = (slot) => {
    setFormData(prev => ({
      ...prev,
      unavailable_slots: prev.unavailable_slots.includes(slot)
        ? prev.unavailable_slots.filter(s => s !== slot)
        : [...prev.unavailable_slots, slot],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setResult(null);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: formData.department || 'General',
        max_hours_per_week: Number(formData.max_hours_per_week) || 20,
        subjects: formData.subjects,
        unavailable_slots: formData.unavailable_slots.join(','),
      };
      const res = await api.post('/teachers', payload);
      setResult(res.data);
      success('Teacher added � timetable auto-adjusted');
      setFormData({ name: '', email: '', password: '', department: '', max_hours_per_week: 20, subjects: [], unavailable_slots: [] });
      reload();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to add teacher');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Teachers</h1>
        <Card><Card.Content><p className="text-text-secondary">Admin access required.</p></Card.Content></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Teachers</h1>
        <p className="text-text-secondary mt-1">Add faculty and auto-fit them into the timetable</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header><Card.Title>Add Teacher</Card.Title>
            <Card.Description>New teachers trigger an incremental timetable adjust.</Card.Description>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Set initial password" />
              <Input label="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
              <Input label="Max Hours / Week" type="number" value={formData.max_hours_per_week} onChange={(e) => setFormData({ ...formData, max_hours_per_week: e.target.value })} min={1} max={40} />
              <div>
                <p className="text-sm font-medium text-text-primary mb-2">Subjects They Can Teach</p>
                <div className="flex flex-wrap gap-2">
                  {courseList.map(c => (
                    <button type="button" key={c.id} onClick={() => toggleSubject(c.code)}
                      className={cnSel(c.subjects.includes(c.code))}>
                      {c.code}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary mb-2">Unavailable Slots</p>
                <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto">
                  {dayOptions.flatMap(d => periodOptions.map(p => {
                    const slot = `${d}-${p}`;
                    return (
                      <button type="button" key={slot} onClick={() => toggleUnavailable(slot)}
                        className={cnSlot(formData.unavailable_slots.includes(slot))}>
                        {slot}
                      </button>
                    );
                  }))}
                </div>
              </div>
              <Button type="submit" loading={saving} className="w-full">
                <UserPlus className="w-4 h-4 mr-1" /> Add Teacher
              </Button>
            </form>
          </Card.Content>
        </Card>

        <div className="space-y-6">
          {result && (
            <Card>
              <Card.Header><Card.Title>Adjust Result</Card.Title></Card.Header>
              <Card.Content className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {result.status === 'adjusted' ? <CheckCircle className="w-5 h-5 text-success" /> : <AlertCircle className="w-5 h-5 text-warning" />}
                  <span className="font-medium">{result.status}</span>
                  <span className="text-text-secondary">&bull; teacher #{result.teacher_id}</span>
                </div>
                <p className="text-text-secondary">Placed: {result.placed}/{result.total_sessions} &bull; Unchanged: {result.unchanged_count}</p>
                {result.unfilled_slots?.length > 0 && (
                  <div className="p-2 rounded bg-danger/10 border border-danger/20">
                    <span className="font-medium text-danger">Unfilled ({result.unfilled_slots.length}):</span>
                    {result.unfilled_slots.map((u, i) => (
                      <div key={i} className="text-text-secondary">{u.class_id}: {u.placed}/{u.required} &mdash; {u.reason}</div>
                    ))}
                  </div>
                )}
                {result.changed_assignments?.length > 0 && (
                  <div className="p-2 rounded bg-background/50 border border-border">
                    <span className="font-medium">Changed ({result.changed_assignments.length})</span>
                    {result.changed_assignments.map((c, i) => (
                      <div key={i} className="text-text-secondary">{c.class_id} @ {c.timeslot_id}: {c.old_teacher_id || '�'} &rarr; {c.new_teacher_id}</div>
                    ))}
                  </div>
                )}
              </Card.Content>
            </Card>
          )}

          <Card>
            <Card.Header><Card.Title>Current Faculty ({Array.isArray(faculty) ? faculty.length : 0})</Card.Title></Card.Header>
            <Card.Content>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {Array.isArray(faculty) && faculty.map(f => (
                  <div key={f.id} className="flex items-center justify-between text-sm p-2 rounded bg-background/50 border border-border">
                    <span className="font-medium">{f.name}</span>
                    <span className="text-text-secondary">{f.department} &bull; {f.maxHours ?? f.max_hours_per_week ?? '�'}h</span>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

function cnSel(active) {
  return active
    ? 'px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-white transition-colors'
    : 'px-3 py-1.5 rounded-lg text-sm font-medium bg-background/50 text-text-secondary border border-border hover:bg-hover transition-colors';
}
function cnSlot(active) {
  return active
    ? 'px-1.5 py-1 rounded text-[11px] font-medium bg-danger/20 text-danger border border-danger/30'
    : 'px-1.5 py-1 rounded text-[11px] font-medium bg-background/50 text-text-secondary border border-border hover:bg-hover';
}

export default Teachers;
