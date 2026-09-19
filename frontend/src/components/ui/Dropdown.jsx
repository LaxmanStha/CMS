import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dropdown = ({ options = [], value, onChange, placeholder = 'Select...', className, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

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

  const handleMouseEnter = () => {
    if (disabled) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setOpen(true), 100);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setOpen(false), 100);
  };

  return (
    <div
      className={cn('relative inline-block w-full', className)}
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'w-full min-w-[140px] flex items-center gap-2 cursor-pointer select-none px-4 py-3 bg-[var(--color-bg-secondary)] rounded-lg',
          'border border-[var(--color-border)] text-[var(--color-text-primary)]',
          'hover:border-[rgba(255,255,255,0.15)] transition-all duration-150',
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