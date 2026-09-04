import { useState, useRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A status filter that stays visually quiet until the user hovers it:
 *  - No chevron/arrow is shown by default.
 *  - Hovering the control reveals the list of all status options.
 *  - Moving the pointer away hides it again.
 *
 * `options` may be an array of strings or `{ value, label }` objects.
 */
const StatusDropdown = ({ options = [], value, onChange, placeholder = 'All Status', className }) => {
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef(null);

  const normalized = options.map((o) =>
    typeof o === 'string'
      ? { value: o, label: o.charAt(0).toUpperCase() + o.slice(1) }
      : o
  );
  const selected = normalized.find((o) => o.value === value);

  const handleEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    leaveTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className={cn('relative inline-block', className)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="select-themed select-control w-auto min-w-[140px] flex items-center justify-between gap-2 cursor-pointer select-none"
      >
        <span className={cn('truncate', !selected && 'text-text-secondary')}>{selected ? selected.label : placeholder}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full glass rounded-xl shadow-lg border border-border py-1.5 animate-dropdown max-h-64 overflow-auto">
          <button
            type="button"
            onClick={() => onChange('')}
            className={cn(
              'w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between',
              !value ? 'text-primary font-medium bg-primary/5' : 'text-text-primary hover:bg-hover'
            )}
          >
            {placeholder}
            {!value && <Check className="w-4 h-4" />}
          </button>
          {normalized.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                'w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between',
                value === o.value
                  ? 'text-primary font-medium bg-primary/5'
                  : 'text-text-primary hover:bg-hover'
              )}
            >
              {o.label}
              {value === o.value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusDropdown;
