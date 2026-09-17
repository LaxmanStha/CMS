import { useState, useRef, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';
import {
  Search, X, Download, AlertTriangle, TrendingUp, TrendingDown,
  ChevronDown, Check,
} from 'lucide-react';

/* ───────────────────────── AlertBadge ───────────────────────── */
const ALERT_VARIANTS = {
  alert: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]',
  success: 'bg-[var(--color-success)]/20 text-[var(--color-success)]',
  danger: 'bg-[var(--color-danger)]/20 text-[var(--color-danger)]',
  info: 'bg-[var(--color-info)]/20 text-[var(--color-info)]',
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
        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
        {subtitle && <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 opacity-80 hover:opacity-100">{actions}</div>}
    </div>
  );
}

/* ───────────────────────── SkeletonCard ───────────────────────── */
export function SkeletonCard({ lines = 3, className }) {
  return (
    <div className={cn('animate-pulse rounded-2xl p-6', className)} style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }} aria-hidden="true">
      <div className="mb-4 h-4 w-1/3 rounded" style={{ backgroundColor: 'var(--color-bg-secondary)' }} />
      <div className="mb-2 h-8 w-1/2 rounded" style={{ backgroundColor: 'var(--color-bg-secondary)' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="mb-2 h-3 w-full rounded" style={{ backgroundColor: 'var(--color-bg-secondary)' }} />
      ))}
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
        'btn btn-primary inline-flex items-center gap-2',
        className,
      )}
    >
      <Download className="h-4 w-4" />
      {children}
    </button>
  );
}

export default {
  AlertBadge,
  SectionHeader,
  SkeletonCard,
  Modal,
  ExportButton,
};