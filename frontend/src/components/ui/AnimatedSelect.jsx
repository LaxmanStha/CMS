import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Check, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Modern, Smooth, Professional Animated Dropdown Component
 */
const AnimatedSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className,
  containerClassName = 'w-full',
  triggerClassName,
  disabled = false,
  searchable = false,
  multiple = false,
  label,
  error,
  hint,
  clearable = false,
  loading = false,
  loadingText = 'Loading options...',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [menuPosition, setMenuPosition] = useState(null);
  const [mounted, setMounted] = useState(false);

  const selectRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize options array: string/number or object { value, label, description, icon }
  const normalizedOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    return options.map((opt) => {
      if (opt !== null && typeof opt === 'object' && 'value' in opt) {
        return {
          value: opt.value,
          label: opt.label !== undefined ? String(opt.label) : String(opt.value),
          description: opt.description || null,
          icon: opt.icon || null,
        };
      }
      return {
        value: opt,
        label: String(opt),
        description: null,
        icon: null,
      };
    });
  }, [options]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const term = searchTerm.toLowerCase();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        String(opt.value).toLowerCase().includes(term) ||
        (opt.description && opt.description.toLowerCase().includes(term))
    );
  }, [normalizedOptions, searchTerm]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate menu position relative to trigger element
  const updateMenuPosition = useCallback(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const estHeight = Math.min(280, Math.max(90, filteredOptions.length * 44 + (searchable ? 48 : 16)));
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const opensUp = spaceBelow < estHeight && rect.top > estHeight + 12;

    setMenuPosition({
      left: rect.left,
      top: opensUp ? rect.top - estHeight - 6 : rect.bottom + 6,
      width: rect.width,
      maxHeight: Math.max(90, opensUp ? rect.top - 16 : spaceBelow),
      opensUp,
    });
  }, [isOpen, filteredOptions.length, searchable]);

  useEffect(() => {
    if (!isOpen) return;

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  // Select / Deselect option handler
  const handleSelect = (option) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValue = currentValues.includes(option.value)
        ? currentValues.filter((v) => v !== option.value)
        : [...currentValues, option.value];
      onChange?.(newValue);
    } else {
      onChange?.(option.value);
      setIsOpen(false);
      setSearchTerm('');
      setFocusedIndex(-1);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : '');
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  // Keyboard navigation: ArrowUp, ArrowDown, Enter, Escape, Tab
  const handleKeyDown = (e) => {
    if (disabled || loading) return;

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      default:
        break;
    }
  };

  const selectedOption = useMemo(() => {
    if (multiple) return null;
    return normalizedOptions.find((o) => o.value === value);
  }, [multiple, normalizedOptions, value]);

  const hasValue = multiple
    ? Array.isArray(value) && value.length > 0
    : selectedOption !== undefined && selectedOption !== null;

  const displayLabel = useMemo(() => {
    if (multiple) return '';
    return selectedOption ? selectedOption.label : '';
  }, [multiple, selectedOption]);

  const triggerClasses = cn(
    'select-themed select-control flex items-center justify-between text-left cursor-pointer',
    'transition-all duration-200 ease-out min-h-[42px] px-3.5 py-2.5 rounded-xl border',
    'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)]',
    'hover:border-[var(--color-accent)]/60 hover:shadow-sm',
    'focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20',
    isOpen && 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 shadow-md',
    disabled && 'cursor-not-allowed opacity-50 bg-[var(--color-bg-surface-2)]/50',
    error && 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20',
    triggerClassName,
    className
  );

  return (
    <div className={cn('form-group', containerClassName, isOpen && 'relative z-40')} ref={selectRef}>
      {label && (
        <label className="label text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5 block">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          ref={triggerRef}
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          className={triggerClasses}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          {...props}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
            {multiple && hasValue ? (
              <div className="flex flex-wrap gap-1.5 flex-1 max-h-20 overflow-y-auto">
                {value.map((v) => {
                  const opt = normalizedOptions.find((o) => o.value === v);
                  return (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--color-accent-muted)] text-[var(--color-accent)] text-xs font-medium"
                    >
                      {opt ? opt.label : String(v)}
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(opt || { value: v });
                        }}
                        className="p-0.5 rounded hover:bg-[var(--color-accent-muted)] cursor-pointer transition-colors"
                        tabIndex={-1}
                      >
                        <X className="w-3 h-3" />
                      </span>
                    </span>
                  );
                })}
              </div>
            ) : hasValue ? (
              <span className="truncate font-medium text-sm text-[var(--color-text-primary)]">
                {selectedOption?.icon && <span className="mr-2 inline-block">{selectedOption.icon}</span>}
                {displayLabel}
              </span>
            ) : (
              <span className="truncate text-sm text-[var(--color-text-muted)]">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {clearable && hasValue && !loading && (
              <span
                role="button"
                onClick={handleClear}
                className="p-1 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                title="Clear selection"
                tabIndex={-1}
              >
                <X className="w-4 h-4" />
              </span>
            )}

            {loading ? (
              <Loader2 className="w-4 h-4 text-[var(--color-accent)] animate-spin" />
            ) : (
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-[var(--color-text-muted)] transition-transform duration-200 ease-out',
                  isOpen && 'rotate-180 text-[var(--color-accent)]'
                )}
              />
            )}
          </div>
        </button>

        {/* Portal-rendered animated dropdown menu */}
        {mounted && isOpen && menuPosition && createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              left: menuPosition.left,
              top: menuPosition.top,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
              zIndex: 9999,
            }}
            className={cn(
              'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]',
              'shadow-xl shadow-black/30 overflow-hidden flex flex-col',
              'animate-dropdown-enter'
            )}
            role="listbox"
            tabIndex={-1}
          >
            {searchable && (
              <div className="p-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] sticky top-0 z-10">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setFocusedIndex(0);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="input w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none"
                    placeholder="Search options..."
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div ref={listRef} className="overflow-y-auto max-h-[240px] py-1.5 scrollbar-thin">
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-[var(--color-text-muted)]">
                  <Loader2 className="w-4 h-4 text-[var(--color-accent)] animate-spin" />
                  <span>{loadingText}</span>
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-4 py-5 text-center text-xs text-[var(--color-text-muted)]">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = multiple
                    ? Array.isArray(value) && value.includes(option.value)
                    : value === option.value;
                  const isFocused = focusedIndex === index;

                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelect(option);
                      }}
                      onMouseEnter={() => setFocusedIndex(index)}
                      className={cn(
                        'w-full px-3.5 py-2.5 text-left text-sm transition-all duration-150 ease-out',
                        'flex items-center justify-between gap-3 group',
                        isSelected
                          ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)] font-semibold'
                          : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]',
                        isFocused && !isSelected && 'bg-[var(--color-bg-secondary)] font-medium',
                        isFocused && isSelected && 'bg-[var(--color-accent-muted)]'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {multiple && (
                          <div
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                              isSelected
                                ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                                : 'border-[var(--color-border)] text-transparent group-hover:border-[var(--color-text-muted)]'
                            )}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{option.label}</span>
                          {option.description && (
                            <span className="text-xs text-[var(--color-text-muted)] truncate font-normal">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {!multiple && isSelected && option.value !== '' && (
                        <Check className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
      </div>

      {(error || hint) && (
        <p className={cn('text-xs mt-1.5 flex items-center gap-1', error ? 'text-[var(--color-danger)] font-medium' : 'text-[var(--color-text-muted)]')}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

export default AnimatedSelect;
export { AnimatedSelect, AnimatedSelect as AnimatedDropdown, AnimatedSelect as Select };