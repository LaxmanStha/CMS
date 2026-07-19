import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Select = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select...', 
  className,
  disabled = false,
  searchable = false,
  multiple = false,
  label,
  error,
  hint,
  clearable = false,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.value && option.value.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (option) => {
    if (multiple) {
      const newValue = value.includes(option.value) 
        ? value.filter(v => v !== option.value)
        : [...value, option.value];
      onChange(newValue);
    } else {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
    setSearchTerm('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const displayValue = multiple 
    ? value.map(v => options.find(o => o.value === v)?.label).filter(Boolean).join(', ')
    : options.find(o => o.value === value)?.label || '';

  return (
    <div className="w-full" ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          ref={inputRef}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 rounded-xl bg-input border transition-all duration-200',
            'text-left focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'hover:border-primary/50',
            'disabled:bg-background disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-danger' : 'border-border',
            (multiple || clearable || searchable) && 'pr-12',
            className
          )}
          {...props}
        >
          <span className={cn(
            'flex items-center justify-between',
            !displayValue && !searchable && 'text-text-secondary'
          )}>
            {multiple && value.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {value.map(v => {
                  const option = options.find(o => o.value === v);
                  return option && (
                    <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs">
                      {option.label}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(option);
                        }}
                        className="p-0.5 rounded hover:bg-primary/20"
                        tabIndex={-1}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : displayValue ? (
              <span className="text-text-primary">{displayValue}</span>
            ) : (
              <span className="text-text-secondary">{placeholder}</span>
            )}
            <div className="flex items-center gap-1.5 ml-2">
              {searchable && isOpen && (
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-40 px-2 py-1 text-sm border-0 focus:outline-none bg-transparent"
                  placeholder="Search..."
                  autoFocus
                />
              )}
              {clearable && value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-lg hover:bg-hover text-text-secondary transition-colors"
                  tabIndex={-1}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-text-secondary transition-transform" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-secondary transition-transform" />
              )}
            </div>
          </span>
        </button>
        {isOpen && (
          <div className="absolute z-50 w-full mt-1.5 glass rounded-xl shadow-lg border border-border py-2 animate-dropdown max-h-60 overflow-auto">
            {searchable && (
              <div className="px-3 py-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Search options..."
                  autoFocus
                />
              </div>
            )}
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-text-secondary text-sm">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelect(option);
                  }}
                  className={cn(
                    'w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-3',
                    value.includes(option.value) 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-text-primary hover:bg-hover'
                  )}
                  tabIndex={-1}
                >
                  {multiple && (
                    <div className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      value.includes(option.value)
                        ? 'bg-primary border-primary text-white'
                        : 'border-border text-transparent'
                    )}>
                      {value.includes(option.value) && (
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-text-secondary ml-auto text-xs">{option.description}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {(error || hint) && (
        <p className={cn('mt-1.5 text-sm', error ? 'text-danger' : 'text-text-secondary')}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

export default Select;
export { Select };
