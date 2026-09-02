import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  Download,
  MoreVertical,
  AlertCircle,
  Package,
  Boxes,
  LayoutGrid,
  Refrigerator,
  Wheat,
  Coffee,
  Snowflake,
  Cookie,
  Bell,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Plus,
} from "lucide-react";

const FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const CATEGORIES = [
  { name: "All Items", icon: LayoutGrid, alert: false },
  { name: "Produce", icon: Wheat, alert: true },
  { name: "Dairy & Eggs", icon: Refrigerator, alert: true },
  { name: "Bakery", icon: Cookie, alert: false },
  { name: "Beverages", icon: Coffee, alert: true },
  { name: "Frozen Foods", icon: Snowflake, alert: false },
  { name: "Snacks", icon: Package, alert: false },
  { name: "Household", icon: Boxes, alert: false },
];

const CATEGORY_HEALTH = [
  { name: "Produce", pct: 38, low: true },
  { name: "Dairy", pct: 72, low: false },
  { name: "Bakery", pct: 64, low: false },
  { name: "Beverages", pct: 41, low: true },
  { name: "Frozen", pct: 88, low: false },
  { name: "Snacks", pct: 95, low: false },
];

const CHART_DATA = [62, 78, 45, 91, 73, 58, 84];
const CHART_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SHELVES = [
  { id: 1, items: ["30%", "40%", "30%"], low: false },
  { id: 2, items: ["50%", "20%", "30%"], low: false },
  { id: 3, items: ["15%", "10%"], low: true },
  { id: 4, items: ["25%", "25%", "25%", "25%"], low: false },
];

const INVENTORY = [
  { product: "Organic Bananas", sku: "PR-1023", category: "Produce", stock: 12, max: 60, status: "Low Stock", lost: "$1,240" },
  { product: "Whole Milk 1L", sku: "DE-2231", category: "Dairy & Eggs", stock: 0, max: 48, status: "Out of Stock", lost: "$2,010" },
  { product: "Sourdough Loaf", sku: "BK-3310", category: "Bakery", stock: 8, max: 40, status: "Low Stock", lost: "$640" },
  { product: "Sparkling Water 12pk", sku: "BV-4412", category: "Beverages", stock: 0, max: 80, status: "Out of Stock", lost: "$1,780" },
  { product: "Frozen Berries", sku: "FR-5501", category: "Frozen Foods", stock: 54, max: 60, status: "In Stock", lost: "$120" },
  { product: "Potato Chips", sku: "SN-6620", category: "Snacks", stock: 22, max: 90, status: "Low Stock", lost: "$430" },
  { product: "Free-Range Eggs", sku: "DE-2239", category: "Dairy & Eggs", stock: 0, max: 50, status: "Out of Stock", lost: "$980" },
  { product: "Ground Coffee", sku: "BV-4488", category: "Beverages", stock: 31, max: 70, status: "Low Stock", lost: "$560" },
  { product: "Dish Soap", sku: "HH-7710", category: "Household", stock: 45, max: 50, status: "In Stock", lost: "$0" },
  { product: "Croissants", sku: "BK-3342", category: "Bakery", stock: 18, max: 35, status: "Low Stock", lost: "$310" },
];

const KPIS = [
  { label: "Total SKUs", value: "1,248", pct: "3.2%", up: true, good: true, note: "vs last week" },
  { label: "Inventory Value", value: "$284,920", pct: "1.8%", up: true, good: true, note: "vs last week" },
  { label: "Critical Alerts", value: "14", pct: "Needs attention", up: false, good: false, note: "" },
  { label: "Lost Sales (MTD)", value: "$12,480", pct: "5.4%", up: true, good: false, note: "vs last month" },
];

function KpiCard({ kpi }) {
  const DeltaIcon = kpi.up ? TrendingUp : TrendingDown;
  const deltaColor = kpi.good ? "text-emerald-500" : "text-orange-400";
  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="text-xs font-semibold uppercase tracking-[0.05em] text-slate-400">{kpi.label}</div>
      <div className="text-[32px] font-bold text-white mt-2">{kpi.value}</div>
      <div className="mt-2 flex items-center gap-1">
        <DeltaIcon size={14} className={deltaColor} />
        <span className={`text-xs font-medium ${deltaColor}`}>{kpi.pct}</span>
        {kpi.note && <span className="text-xs text-slate-500">{kpi.note}</span>}
      </div>
    </div>
  );
}

function ChartCard() {
  const max = 100;
  const yTicks = [0, 25, 50, 75, 100];
  return (
    <div className="lg:col-span-2 rounded-2xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-lg font-semibold text-white">Stock Replenishment</div>
          <div className="text-xs text-slate-500 mt-1">Units replenished vs. threshold</div>
        </div>
        <button
          type="button"
          aria-label="Select time range"
          className={`flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:scale-105 transition-all ${FOCUS}`}
        >
          Last 7 days <ChevronDown size={16} className="text-slate-500" />
        </button>
      </div>
      <div className="relative h-[160px]">
        <div className="absolute left-0 top-0 h-full w-8 flex flex-col justify-between items-end pr-2">
          {yTicks.slice().reverse().map((t) => (
            <span key={t} className="text-[10px] text-slate-500">{t}%</span>
          ))}
        </div>
        <div className="ml-8 h-full border-t border-slate-700/50 relative">
          <div className="absolute inset-0 flex items-end gap-3">
            {CHART_DATA.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full h-[120px] flex items-end">
                  <div
                    className="inv-bar w-full rounded-t-sm bg-gradient-to-t from-orange-500 to-orange-400 opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${(value / max) * 120}px`, animationDelay: `${i * 50}ms` }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-2 text-center">{CHART_DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryHealth() {
  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50">
      <div className="text-lg font-semibold text-white mb-1">Category Health</div>
      <div className="text-xs text-slate-500 mb-5">Stock coverage by category</div>
      <div className="space-y-4">
        {CATEGORY_HEALTH.map((c) => (
          <div key={c.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-300">{c.name}</span>
              <span className="text-xs text-slate-400">{c.pct}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full ${c.low ? "bg-orange-500" : "bg-emerald-500"}`}
                style={{ width: `${c.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShelfViz() {
  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-white">Shelf Layout</div>
        <span className="text-xs text-slate-500">Live floor view</span>
      </div>
      <div className="space-y-2">
        {SHELVES.map((shelf) => (
          <div
            key={shelf.id}
            className="h-12 rounded-lg bg-gradient-to-b from-slate-700 to-slate-600 border border-slate-600 flex items-center gap-1 px-2"
          >
            {shelf.low && (
              <span className="text-[10px] font-semibold text-red-300 mr-1">LOW</span>
            )}
            {shelf.items.map((w, i) => (
              <div
                key={i}
                className={`h-8 rounded shrink-0 ${shelf.low ? "bg-gradient-to-b from-red-900 to-red-800 opacity-60" : "bg-gradient-to-b from-amber-300 to-amber-500"}`}
                style={{ flexBasis: w }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "In Stock")
    return (
      <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded">
        In Stock
      </span>
    );
  if (status === "Low Stock")
    return (
      <span className="inv-alert-pulse text-[10px] font-semibold bg-orange-600/30 text-orange-200 px-2 py-1 rounded">
        Low Stock
      </span>
    );
  return <span className="text-[11px] font-semibold text-red-300">OUT OF STOCK</span>;
}

function InventoryTable({ rows, requested, onRequest }) {
  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-semibold text-white">Low Stock &amp; Critical Items</div>
          <div className="text-xs text-slate-500 mt-1">Prioritized by revenue at risk</div>
        </div>
        <button className={`p-2 rounded-lg hover:bg-slate-800/40 text-slate-400 ${FOCUS}`} aria-label="More options">
          <MoreVertical size={16} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              {["Product", "Category", "Stock", "Status", "Lost Sales", "Action"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-slate-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.sku}
                className="inv-row border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-white">{r.product}</div>
                  <div className="text-xs text-slate-500">{r.sku}</div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-300">{r.category}</td>
                <td className="px-4 py-4">
                  <span className="text-sm text-white">{r.stock}</span>{" "}
                  <span className="text-xs text-slate-500">/ {r.max}</span>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-orange-400">{r.lost}</td>
                <td className="px-4 py-4">
                  {requested.has(r.sku) ? (
                    <span className="text-xs font-medium text-emerald-400">Requested &#10003;</span>
                  ) : (
                    <button
                      onClick={() => onRequest(r.sku)}
                      className={`inline-flex items-center gap-1 bg-transparent border-0 text-indigo-400 hover:text-indigo-300 text-xs font-medium cursor-pointer ${FOCUS}`}
                    >
                      <Plus size={14} /> Send Request
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Sidebar({ selected, onSelect, mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`${mobileOpen ? "fixed left-0 top-0 z-50 h-full" : "hidden"} lg:block w-72 shrink-0 rounded-2xl p-6 bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-600/50 overflow-y-auto max-h-screen`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
              S
            </div>
            <span className="font-semibold text-white">ShelfIQ</span>
          </div>
          <button className={`lg:hidden p-1 text-slate-400 ${FOCUS}`} onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            aria-label="Search inventory"
            placeholder="Search products..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.05em] text-slate-400 mb-3">
          Categories
        </div>
        <nav>
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isSel = selected === c.name;
            return (
              <div
                key={c.name}
                onClick={() => onSelect(c.name)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer mb-3 transition-all ${
                  isSel
                    ? "bg-indigo-600/20 border-2 border-indigo-500 hover:scale-100"
                    : "border border-transparent hover:bg-slate-800/40"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-300">{c.name}</span>
                </span>
                {c.alert && (
                  <span className="inv-alert-pulse text-[10px] font-semibold bg-orange-600/30 text-orange-200 px-2 py-1 rounded">
                    Critically Low
                  </span>
                )}
              </div>
            );
          })}
        </nav>
        <div className="mt-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <Bell size={16} className="text-orange-400" /> 14 restock alerts
          </div>
          <div className="text-xs text-slate-500 mt-1">Resolve before end of day</div>
        </div>
      </aside>
    </>
  );
}

export default function InventoryDashboard() {
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [requested, setRequested] = useState(() => new Set());

  const rows = useMemo(() => {
    if (selectedCategory === "All Items") return INVENTORY;
    return INVENTORY.filter((r) => r.category === selectedCategory);
  }, [selectedCategory]);

  const onRequest = (sku) => setRequested((prev) => new Set(prev).add(sku));

  return (
    <div className="inv-dash min-h-screen bg-slate-900 text-white p-4 flex gap-4">
      <style>{`
        .inv-dash *, .inv-dash *::before, .inv-dash *::after { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes invSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes invPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
        @keyframes invFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .inv-bar { animation: invSlideUp 0.6s ease-out both; }
        .inv-alert-pulse { animation: invPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .inv-row { animation: invFadeIn 0.3s ease-out both; }
      `}</style>
      <Sidebar
        selected={selectedCategory}
        onSelect={(n) => {
          setSelectedCategory(n);
          setMobileOpen(false);
        }}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold leading-[1.3] text-white">Inventory Overview</h1>
            <div className="text-sm text-slate-400 mt-1">Real-time stock health across 8 categories</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={18} />
            </button>
            <button
              className={`flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:scale-105 transition-all ${FOCUS}`}
            >
              <Download size={16} className="text-indigo-400" /> Export
            </button>
            <button
              className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg px-4 py-2 text-sm text-white hover:scale-105 transition-all ${FOCUS}`}
            >
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          {KPIS.map((k) => (
            <KpiCard key={k.label} kpi={k} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <ChartCard />
          <CategoryHealth />
        </div>
        <div className="mb-4">
          <ShelfViz />
        </div>
        <InventoryTable rows={rows} requested={requested} onRequest={onRequest} />
      </main>
    </div>
  );
}
