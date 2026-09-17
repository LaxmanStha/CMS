import { useMemo, useState } from 'react';
import { Package, Boxes, Shirt, Apple, BookOpen, AlertTriangle, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/lib/utils';

const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', icon: Package, alert: false, count: 42 },
  { id: 'groceries', label: 'Groceries', icon: Apple, alert: true },
  { id: 'clothing', label: 'Clothing', icon: Shirt, alert: false, count: 18 },
  { id: 'books', label: 'Books', icon: BookOpen, alert: false, count: 7 },
  { id: 'storage', label: 'Storage', icon: Boxes, alert: true },
];

const INVENTORY = [
  { id: 1, sku: 'EL-001', name: 'Wireless Earbuds', category: 'electronics', stock: 120, status: 'In Stock' },
  { id: 2, sku: 'GR-014', name: 'Organic Coffee', category: 'groceries', stock: 8, status: 'Low Stock' },
  { id: 3, sku: 'CL-009', name: 'Cotton T-Shirt', category: 'clothing', stock: 0, status: 'Out of Stock' },
  { id: 4, sku: 'BK-022', name: 'React Handbook', category: 'books', stock: 34, status: 'In Stock' },
  { id: 5, sku: 'ST-003', name: 'Plastic Crates', category: 'storage', stock: 5, status: 'Low Stock' },
  { id: 6, sku: 'EL-008', name: 'USB-C Hub', category: 'electronics', stock: 0, status: 'Out of Stock' },
];

const SALES = [
  { label: 'Mon', value: 420 },
  { label: 'Tue', value: 510 },
  { label: 'Wed', value: 380 },
  { label: 'Thu', value: 640 },
  { label: 'Fri', value: 720 },
];

const STATUS_META = {
  'In Stock': { cls: 'text-[var(--color-success)]', badge: 'success' },
  'Low Stock': { cls: 'text-[var(--color-warning)]', badge: 'warning' },
  'Out of Stock': { cls: 'text-[var(--color-danger)]', badge: 'danger' },
};

const COLUMNS = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Product' },
  {
    key: 'stock', label: 'Stock',
    render: (r) => <span style={{ color: `var(--color-${STATUS_META[r.status].cls.split('-')[1] || 'success'})` }}>{r.stock}</span>,
  },
  {
    key: 'status', label: 'Status',
    render: (r) => <Badge variant={STATUS_META[r.status].badge || 'default'}>{r.status}</Badge>,
  },
];

export default function StoreInventory() {
  const [active, setActive] = useState('electronics');
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [modal, setModal] = useState(false);

  const rows = useMemo(() => {
    return INVENTORY.filter((r) =>
      (catFilter === 'all' || r.category === catFilter) &&
      r.name.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query, catFilter]);

  const exportData = rows.map(({ id, ...rest }) => rest);

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-72">
          <Card className="flex flex-col gap-1">
            <div className="mb-2">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Categories</h3>
            </div>
            <nav className="flex flex-col gap-1" aria-label="Categories">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActive(c.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active === c.id
                      ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {c.icon && <c.icon className="h-4 w-4 shrink-0 opacity-80 hover:opacity-100" />}
                  <span className="flex-1 text-left">{c.label}</span>
                  {c.alert && <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide" style={{ backgroundColor: 'rgba(202, 138, 4, 0.2)', color: 'var(--color-warning)' }}>Alert</span>}
                  {typeof c.count === 'number' && !c.alert && (
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.count}</span>
                  )}
                </button>
              ))}
            </nav>
            <Button className="mt-3 w-full" variant="primary">
              <Plus className="h-4 w-4 mr-2" /> Add Category
            </Button>
          </Card>
        </aside>

        {/* Main */}
        <main className="flex-1 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Store Inventory</h1>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Live stock & sales overview</p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                className="w-44"
                value={catFilter}
                onChange={setCatFilter}
                options={[{ value: 'all', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.label }))]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-6 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total SKUs</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>87</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Low / Out</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>3</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Revenue</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>$4.2k</p>
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Weekly Sales</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Units sold per day</p>
              </div>
              <Badge variant="info">Live</Badge>
            </div>
            <div className="flex items-end gap-3 h-[220px]" style={{ backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
              {SALES.map((d, i) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="chart-bar w-full rounded-t-sm"
                      style={{
                        height: `${(d.value / 720) * 100}%`,
                        background: 'linear-gradient(to top, var(--color-accent), var(--color-accent-hover))',
                        opacity: 0.8,
                        animationDelay: `${i * 50}ms`,
                      }}
                      title={`${d.label}: ${d.value}`}
                    />
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{d.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Inventory</h3>
              </div>
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <Table
              columns={COLUMNS}
              data={rows}
              keyField="id"
              searchable={false}
              filterable={false}
              paginated={false}
              emptyMessage="No products found"
            />
          </Card>
        </main>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Product details"
        footer={
          <Button variant="primary" onClick={() => setModal(false)}>Close</Button>
        }
      >
        Select a row to inspect product details. This dialog demonstrates the reusable Modal component.
      </Modal>
    </div>
  );
}