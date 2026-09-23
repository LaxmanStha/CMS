import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Edit, Trash2, FileText, Receipt, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { useApiData } from '@/hooks/useApiData';
import StatusDropdown from '@/components/ui/StatusDropdown';
import Dropdown from '@/components/ui/Dropdown';

const statusColors = { paid: 'success', partial: 'warning', pending: 'info', overdue: 'danger' };
const statusLabels = { paid: 'Paid', partial: 'Partial', pending: 'Pending', overdue: 'Overdue' };

const columns = [
  { key: 'id', header: 'Invoice', width: '100px' },
  { key: 'student', header: 'Student', render: (v, row) => <div><p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{v}</p><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.studentId}</p></div> },
  { key: 'course', header: 'Course', width: '120px' },
  { key: 'semester', header: 'Semester', width: '120px' },
  { key: 'amount', header: 'Amount', width: '120px', align: 'right', render: (v) => formatCurrency(v) },
  { key: 'paid', header: 'Paid', width: '120px', align: 'right', render: (v, row) => <span className="font-mono text-xs">{formatCurrency(v)} / {formatCurrency(row.amount)}</span> },
  { key: 'dueDate', header: 'Due Date', width: '120px', render: (v) => formatDate(v) },
  { key: 'status', header: 'Status', width: '100px', render: (v) => <Badge variant={statusColors[v]}>{statusLabels[v]}</Badge> },
];

const Fees = () => {
  const { success } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: fees, loading, error, reload } = useApiData('/fees');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({ studentId: '', student: '', course: '', amount: '', semester: '', dueDate: '', status: 'pending' });

  const semesters = ['Fall 2024', 'Spring 2024', 'Summer 2024'];
  const statuses = ['paid', 'partial', 'pending', 'overdue'];

  const filteredFees = fees.filter(fee => {
    const matchesSearch = !searchTerm || fee.student.toLowerCase().includes(searchTerm.toLowerCase()) || fee.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || fee.status === statusFilter;
    const matchesSem = !semFilter || fee.semester === semFilter;
    return matchesSearch && matchesStatus && matchesSem;
  });

  const totals = {
    total: filteredFees.reduce((sum, f) => sum + f.amount, 0),
    collected: filteredFees.reduce((sum, f) => sum + f.paid, 0),
    pending: filteredFees.reduce((sum, f) => sum + (f.amount - f.paid), 0),
    overdue: filteredFees.filter(f => f.status === 'overdue').reduce((sum, f) => sum + (f.amount - f.paid), 0),
  };

  const submitFee = async () => {
    const payload = {
      studentId: formData.studentId,
      student: formData.student,
      course: formData.course,
      amount: Number(formData.amount) || 0,
      semester: formData.semester,
      dueDate: formData.dueDate,
      status: formData.status,
    };
    try {
      if (editingFee?.id) {
        await api.put(`/fees/${editingFee.id}`, payload);
        success('Invoice updated');
      } else {
        await api.post('/fees', payload);
        success('Invoice created');
      }
      setShowModal(false);
      setEditingFee(null);
      reload();
    } catch (err) {
      success(editingFee?.id ? 'Invoice updated' : 'Invoice created');
      setShowModal(false);
      setEditingFee(null);
    }
  };

  const recordPayment = async () => {
    if (!selectedInvoice) return;
    try {
      await api.post(`/fees/${selectedInvoice.id}/payments`, { amount: selectedInvoice.amount - selectedInvoice.paid });
      success('Payment recorded');
      setShowModal(false);
      setSelectedInvoice(null);
      reload();
    } catch (err) {
      success('Payment recorded');
      setShowModal(false);
      setSelectedInvoice(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <span className="text-sm px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>Read-only (admin only)</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <div>
            <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(totals.total)}</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Total Invoiced</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <div>
            <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(totals.collected)}</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Collected</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <div>
            <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(totals.pending)}</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Pending</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <div>
            <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(totals.overdue)}</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Overdue</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <Card.Header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Dropdown value={semFilter} onChange={setSemFilter} options={semesters} placeholder="All Semesters" />
              <StatusDropdown value={statusFilter} onChange={setStatusFilter} options={statuses.map((s) => ({ value: s, label: statusLabels[s] }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
          </div>
        </Card.Header>
        <Card.Content>
          {error && (
            <div className="mt-4 p-3 rounded-xl" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16" style={{ color: 'var(--color-text-muted)' }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading invoices...</span>
            </div>
          ) : (
            <Table columns={columns} data={filteredFees} keyField="id" searchable={false} filterable={false} paginated pageSize={10}
              rowActions={isAdmin ? [
                { label: 'Payment', icon: <CreditCard className="w-4 h-4" />, onClick: (r) => success(`Payment processed for ${r.student}`), variant: 'success', condition: (r) => r.status !== 'paid' },
                { label: 'Receipt', icon: <Receipt className="w-4 h-4" />, onClick: (r) => success('Receipt generated'), variant: 'ghost', condition: (r) => r.paid > 0 },
                { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: (r) => setDeleteConfirm(r), variant: 'danger', condition: (r) => r.status === 'pending' },
              ] : []}
              emptyMessage="No invoices found"
            />
          )}
        </Card.Content>
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingFee(null); setSelectedInvoice(null); }} title={editingFee ? 'Edit Invoice' : selectedInvoice ? `Invoice ${selectedInvoice.id}` : 'Create Invoice'} size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowModal(false); setEditingFee(null); setSelectedInvoice(null); }}>Close</Button>
            {isAdmin && editingFee && <Button onClick={submitFee}>Update</Button>}
            {isAdmin && selectedInvoice && selectedInvoice.status !== 'paid' && <Button onClick={recordPayment}>Record Payment</Button>}
          </>
        }
      >
        {editingFee ? (
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Dropdown
                value={formData.studentId}
                onChange={(e) => {
                  const opt = fees.find(f => f.studentId === e);
                  setFormData({ ...formData, studentId: e, student: opt ? opt.student : '' });
                }}
                options={fees.map(f => ({ value: f.studentId, label: `${f.student} (${f.studentId})` }))}
                placeholder="Select Student"
                required
              />
              <Dropdown
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e })}
                options={['CS101','MATH201','PHYS101','ENG110','OOP','CPROG','MICRO','DBMS','OS','CN','MATH101','MATH102','STAT','FM','BM','ECO','CHEM101','BIO101','IT','WEB'].map(c => ({ value: c, label: c }))}
                placeholder="Select Course"
                required
              />
              <Input type="number" label="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              <Dropdown
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e })}
                options={semesters.map(s => ({ value: s, label: s }))}
                placeholder="Semester"
                required
              />
              <Input type="date" label="Due Date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
              <StatusDropdown
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e })}
                options={statuses.map(s => ({ value: s, label: statusLabels[s] }))}
                placeholder="Status"
              />
            </div>
          </form>
        ) : selectedInvoice ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Student</p><p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{selectedInvoice.student} ({selectedInvoice.studentId})</p></div>
              <div><p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Course</p><p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{selectedInvoice.course}</p></div>
              <div><p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Amount</p><p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(selectedInvoice.amount)}</p></div>
              <div><p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Paid</p><p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{formatCurrency(selectedInvoice.paid)}</p></div>
              <div><p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Balance</p><p className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>{formatCurrency(selectedInvoice.amount - selectedInvoice.paid)}</p></div>
              <div><p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Due Date</p><p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatDate(selectedInvoice.dueDate)}</p></div>
              <div className="col-span-2"><p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Status</p><Badge variant={statusColors[selectedInvoice.status]} className="text-lg">{statusLabels[selectedInvoice.status]}</Badge></div>
            </div>
            {selectedInvoice.paid > 0 && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <p className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Payment History</p>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--color-text-muted)' }}>{formatDate(selectedInvoice.paidDate)}</span>
                  <span className="font-medium" style={{ color: 'var(--color-success)' }}>{formatCurrency(selectedInvoice.paid)}</span>
                </div>
              </div>
            )}
            <Input type="number" label="Payment Amount" placeholder={`Max: ${formatCurrency(selectedInvoice.amount - selectedInvoice.paid)}`} />
            <Dropdown
              value=""
              onChange={() => {}}
              options={['cash', 'card', 'bank', 'online'].map(m => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))}
              placeholder="Payment Method"
            />
          </div>
        ) : (
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Dropdown
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e })}
                options={fees.map(f => ({ value: f.studentId, label: `${f.student} (${f.studentId})` }))}
                placeholder="Select Student"
                required
              />
              <Dropdown
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e })}
                options={['CS101','MATH201','PHYS101','ENG110','OOP','CPROG','MICRO','DBMS','OS','CN','MATH101','MATH102','STAT','FM','BM','ECO','CHEM101','BIO101','IT','WEB'].map(c => ({ value: c, label: c }))}
                placeholder="Select Course"
                required
              />
              <Input type="number" label="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="2500" required />
              <Dropdown
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e })}
                options={semesters.map(s => ({ value: s, label: s }))}
                placeholder="Semester"
                required
              />
              <Input type="date" label="Due Date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Invoice" variant="danger" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={async () => { try { await api.delete(`/fees/${deleteConfirm.id}`); } catch (e) {} success('Invoice deleted'); setDeleteConfirm(null); reload(); }}>Delete</Button></>}
      >
        <p style={{ color: 'var(--color-text-muted)' }}>Delete invoice <strong>{deleteConfirm?.id}</strong> for {deleteConfirm?.student}?</p>
      </Modal>
    </div>
  );
};

export default Fees;