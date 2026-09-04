import { useState, useRef, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';
import {
  Search, X, Download, AlertTriangle, TrendingUp, TrendingDown,
  ChevronDown, Check,
} from 'lucide-react';

/* ───────────────────────── DarkCard ───────────────────────── */
export function DarkCard({ children, className, animated = true, hover = true, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6',
        hover && 'transition-colors hover:border-slate-700',
        animated && 'animate-fade-in',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── CategoryItem ───────────────────────── */
export function CategoryItem({
  label, icon: Icon, selected = false, alert = false, count, onClick, className,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        selected
          ? 'bg-slate-800 text-white'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white',
        alert && !selected && 'text-orange-400 hover:text-orange-400',
        className,
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80 hover:opacity-100" />}
      <span className="flex-1 text-left">{label}</span>
      {alert && <AlertBadge variant="alert">Alert</AlertBadge>}
      {typeof count === 'number' && !alert && (
        <span className="text-xs text-slate-500">{count}</span>
      )}
    </button>
  );
}

/* ───────────────────────── BarChart ─────────────────────────
   NOTE: bar height is data-driven, so it uses an inline `height`
   (the one unavoidable exception — every other style is a Tailwind class). */
export function BarChart({ data = [], animated = true, className, height = 200 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div
      className={cn('flex items-end gap-3', className)}
      style={{ height }}
      role="img"
      aria-label="Bar chart"
    >
      {data.map((d, i) => (
        <div key={d.label ?? i} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className={cn(
                'chart-bar w-full rounded-t-md',
                animated && 'animate-slide-up',
              )}
              style={{ height: `${(d.value / max) * 100}%` }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="text-xs text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── DataTable ───────────────────────── */
export function DataTable({
  columns = [], data = [], animated = true, onRowClick, className, rowClassName,
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('table-dark w-full', className)}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className={cn(animated && 'stagger-up')}>
          {data.map((row, ri) => (
            <tr
              key={row.id ?? ri}
              onClick={() => onRowClick?.(row)}
              className={cn(
                onRowClick && 'cursor-pointer',
                rowClassName?.(row, ri),
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.cellClassName}>
                  {col.render ? col.render(row, ri) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────── AlertBadge ───────────────────────── */
const ALERT_VARIANTS = {
  alert: 'bg-orange-500/20 text-orange-400',
  success: 'bg-emerald-500/20 text-emerald-400',
  danger: 'bg-red-500/20 text-red-400',
  info: 'bg-indigo-500/20 text-indigo-400',
};
export function AlertBadge({ children, variant = 'alert', pulse = true, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide',
        ALERT_VARIANTS[variant],
        pulse && 'animate-pulse-soft',
        className,
      )}
    >
      {variant === 'alert' && <AlertTriangle className="h-3 w-3" />}
      {children}
    </span>
  );
}

/* ───────────────────────── SectionHeader ───────────────────────── */
export function SectionHeader({ title, subtitle, actions, className }) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 opacity-80 hover:opacity-100">{actions}</div>}
    </div>
  );
}

/* ───────────────────────── StatCard ───────────────────────── */
export function StatCard({ label, value, icon: Icon, trend, animated = true, className }) {
  const positive = trend == null ? null : trend >= 0;
  return (
    <DarkCard animated={animated} className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        {Icon && (
          <span className="rounded-lg bg-slate-800 p-2 text-indigo-400">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      {trend != null && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            positive ? 'text-emerald-400' : 'text-orange-400',
          )}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {positive ? '+' : ''}{trend}% vs last month
        </div>
      )}
    </DarkCard>
  );
}

/* ───────────────────────── SearchInput ───────────────────────── */
export function SearchInput({ value, onChange, onClear, placeholder = 'Search…', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="input-dark w-full pl-9 pr-9 placeholder:text-slate-500"
      />
      {value && (
        <button
          type="button"
          onClick={() => onClear?.()}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ───────────────────────── Select ───────────────────────── */
export function Select({ options = [], value, onChange, placeholder = 'Select…', className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const selected = options.find((o) => o.value === value);
  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="select-themed select-control flex w-full items-center justify-between pr-3"
      >
        <span className={selected ? 'text-white' : 'text-slate-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-lg animate-fade-in"
        >
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => { onChange?.(o.value); setOpen(false); }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors',
                  o.value === value ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white',
                )}
              >
                {o.label}
                {o.value === value && <Check className="h-4 w-4 text-indigo-400" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ───────────────────────── SkeletonCard ───────────────────────── */
export function SkeletonCard({ lines = 3, className }) {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900 p-6" aria-hidden="true">
      <div className="mb-4 h-4 w-1/3 rounded bg-slate-700" />
      <div className="mb-2 h-8 w-1/2 rounded bg-slate-700" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="mb-2 h-3 w-full rounded bg-slate-800" />
      ))}
    </div>
  );
}

/* ───────────────────────── Modal ───────────────────────── */
export function Modal({ open, onClose, title, children, footer, className }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl animate-slide-up',
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-slate-400">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ───────────────────────── ExportButton ───────────────────────── */
function downloadCSV(filename, rows) {
  const headers = Object.keys(rows[0] ?? {});
  const csv = [headers.join(',')]
    .concat(rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
export function ExportButton({ data, fileName = 'export.csv', onClick, children = 'Export', className }) {
  const handle = () => {
    if (data?.length) downloadCSV(fileName, data);
    onClick?.();
  };
  return (
    <button
      type="button"
      onClick={handle}
      className={cn(
        'btn btn-primary inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500',
        className,
      )}
    >
      <Download className="h-4 w-4" />
      {children}
    </button>
  );
}

export default {
  DarkCard, CategoryItem, BarChart, DataTable, AlertBadge,
  SectionHeader, StatCard, SearchInput, Select, SkeletonCard, Modal, ExportButton,
};
