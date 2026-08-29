import { useState, useRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Generic hover-reveal dropdown used for filter boxes:
 *  - No chevron/arrow is shown by default.
 *  - Hovering the control reveals the list of options.
 *  - Moving the pointer away hides it again.
 *
 * `options` may be an array of strings or `{ value, label }` objects.
 */
const Dropdown = ({ options = [], value, onChange, placeholder = 'Select...', className }) => {
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef(null);

  const normalized = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
  // Prepend an explicit "All" option (derived from the placeholder) so the
  // filter can always be reset to show everything. Skipped if a placeholder
  // wasn't provided or an "All"-style option already exists.
  const allOption = placeholder ? { value: '', label: placeholder } : null;
  const hasAll = normalized.some((o) => o.value === '' || o.value === 'all');
  const list = allOption && !hasAll ? [allOption, ...normalized] : normalized;
  const selected = list.find((o) => o.value === value);

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
        className="input w-auto min-w-[140px] flex items-center justify-between gap-2 cursor-pointer select-none"
      >
        <span className={cn('truncate', !selected && 'text-text-secondary')}>{selected ? selected.label : placeholder}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full glass rounded-xl shadow-lg border border-border py-1.5 animate-dropdown max-h-64 overflow-auto">
          {list.map((o) => (
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

export default Dropdown;
