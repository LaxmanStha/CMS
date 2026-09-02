import { useMemo, useState } from 'react';
import { Package, Boxes, Shirt, Apple, BookOpen, AlertTriangle, Plus } from 'lucide-react';
import {
  DarkCard, CategoryItem, BarChart, DataTable, AlertBadge,
  SectionHeader, StatCard, SearchInput, Select, ExportButton, Modal,
} from '@/components/ui';

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
  'In Stock': { cls: 'text-emerald-400', badge: null },
  'Low Stock': { cls: 'text-orange-400', badge: 'alert' },
  'Out of Stock': { cls: 'text-red-400', badge: 'danger' },
};

const COLUMNS = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Product' },
  {
    key: 'stock', label: 'Stock',
    render: (r) => <span className={STATUS_META[r.status].cls}>{r.stock}</span>,
  },
  {
    key: 'status', label: 'Status',
    render: (r) => (
      STATUS_META[r.status].badge
        ? <AlertBadge variant={STATUS_META[r.status].badge} pulse>{r.status}</AlertBadge>
        : <span className="text-emerald-400">{r.status}</span>
    ),
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
    <div className="min-h-screen bg-[#0B0F19] p-4 text-text-primary">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-72">
          <DarkCard className="flex flex-col gap-1">
            <SectionHeader title="Categories" className="mb-2" />
            <nav className="stagger-fade flex flex-col gap-1" aria-label="Categories">
              {CATEGORIES.map((c) => (
                <CategoryItem
                  key={c.id}
                  label={c.label}
                  icon={c.icon}
                  alert={c.alert}
                  count={c.count}
                  selected={active === c.id}
                  onClick={() => setActive(c.id)}
                />
              ))}
            </nav>
            <button className="btn btn-primary mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
              <Plus className="h-4 w-4" /> Add Category
            </button>
          </DarkCard>
        </aside>

        {/* Main */}
        <main className="flex-1 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">Store Inventory</h1>
              <p className="text-sm text-text-secondary">Live stock & sales overview</p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                className="w-44"
                value={catFilter}
                onChange={setCatFilter}
                options={[{ value: 'all', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.label }))]}
              />
              <ExportButton data={exportData} fileName="inventory.csv" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total SKUs" value="87" icon={Package} trend={12} />
            <StatCard label="Low / Out" value="3" icon={AlertTriangle} trend={-8} />
            <StatCard label="Revenue" value="$4.2k" icon={Boxes} trend={5} />
          </div>

          <DarkCard>
            <SectionHeader
              title="Weekly Sales"
              subtitle="Units sold per day"
              actions={<AlertBadge variant="info">Live</AlertBadge>}
            />
            <BarChart data={SALES} height={220} />
          </DarkCard>

          <DarkCard>
            <SectionHeader
              title="Inventory"
              actions={
                <SearchInput
                  className="w-56"
                  value={query}
                  onChange={setQuery}
                  onClear={() => setQuery('')}
                  placeholder="Search products…"
                />
              }
            />
            <DataTable columns={COLUMNS} data={rows} animated onRowClick={() => setModal(true)} />
          </DarkCard>
        </main>
      </div>

<Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Product details"
        footer={
          <button onClick={() => setModal(false)} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
            Close
          </button>
        }
      >
        Select a row to inspect product details. This dialog demonstrates the
        reusable <code className="text-indigo-400">Modal</code> component.
      </Modal>
    </div>
  );
}
