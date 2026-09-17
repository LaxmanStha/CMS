import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dropdown = ({ options = [], value, onChange, placeholder = 'Select...', className, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalized = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
  const allOption = placeholder ? { value: '', label: placeholder } : null;
  const hasAll = normalized.some((o) => o.value === '' || o.value === 'all');
  const list = allOption && !hasAll ? [allOption, ...normalized] : normalized;
  const selected = list.find((o) => o.value === value);

  return (
    <div
      className={cn('relative inline-block', className)}
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={cn(
          'select-themed select-control w-auto min-w-[140px] flex items-center justify-between gap-2 cursor-pointer select-none',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className={cn('truncate', !selected && 'text-[var(--color-text-muted)]')}>{selected ? selected.label : placeholder}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-[var(--color-bg-elevated)] rounded-xl shadow-lg border border-[var(--color-border)] py-1.5 max-h-64 overflow-auto animate-dropdown">
          {list.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={cn(
                'w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between',
                value === o.value
                  ? 'text-[var(--color-accent)] font-medium bg-[var(--color-accent-muted)]'
                  : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
              )}
            >
              {o.label}
              {value === o.value && <Check className="w-4 h-4 text-[var(--color-accent)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;