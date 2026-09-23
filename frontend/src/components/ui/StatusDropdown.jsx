import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

const StatusDropdown = ({ options = [], value, onChange, placeholder = 'All Status', className, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

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
    typeof o === 'string'
      ? { value: o, label: o.charAt(0).toUpperCase() + o.slice(1) }
      : o
  );
  const selected = normalized.find((o) => o.value === value);

  const updateMenuPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      updateMenuPosition();
      setOpen(true);
    }, 100);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 100);
  };

  const handleClick = () => {
    if (disabled) return;
    updateMenuPosition();
    setOpen(prev => !prev);
  };

  const handleMenuMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleMenuMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setOpen(false), 100);
  };

  const dropdownMenu = open && (
    createPortal(
      <div
        ref={menuRef}
        className="fixed z-[9999] bg-[var(--color-bg-elevated)] rounded-xl shadow-lg border border-[var(--color-border)] py-1.5 max-h-64 overflow-auto animate-dropdown"
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          minWidth: menuPosition.width,
        }}
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMenuMouseLeave}
      >
        <button
          type="button"
          onClick={() => { onChange(''); setOpen(false); }}
          className={cn(
            'w-full px-4 py-2 text-left text-sm flex items-center justify-between',
            !value ? 'text-[var(--color-accent)] font-medium bg-[var(--color-accent-muted)]' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
          )}
        >
          {placeholder}
          {!value && <Check className="w-4 h-4 text-[var(--color-accent)]" />}
        </button>
        {normalized.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => { onChange(o.value); setOpen(false); }}
            className={cn(
              'w-full px-4 py-2 text-left text-sm flex items-center justify-between',
              value === o.value
                ? 'text-[var(--color-accent)] font-medium bg-[var(--color-accent-muted)]'
                : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
            )}
          >
            {o.label}
            {value === o.value && <Check className="w-4 h-4 text-[var(--color-accent)]" />}
          </button>
        ))}
      </div>,
      document.body
    )
  );

  return (
    <div
      className={cn('relative inline-block', className)}
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'w-auto min-w-[140px] flex items-center gap-2 cursor-pointer select-none px-4 py-3 bg-[var(--color-bg-secondary)] rounded-lg',
          'border border-[var(--color-border)] text-[var(--color-text-primary)]',
          'hover:border-[rgba(255,255,255,0.15)] transition-all duration-150',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className={cn('truncate', !selected && 'text-[var(--color-text-muted)]')}>{selected ? selected.label : placeholder}</span>
      </button>

      {dropdownMenu}
    </div>
  );
};

export default StatusDropdown;