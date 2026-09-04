import { useId } from 'react';
import { cn } from '@/lib/utils';

const Input = ({ 
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  leftElement,
  rightElement,
  className,
  type = 'text',
  id,
  ...props 
}) => {
  const reactId = useId();
  const inputId = id || `input-${reactId}`;
  
  return (
    <div className="w-full min-w-0">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-primary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative min-w-0">
        {(leftIcon || leftElement) && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
            {leftIcon || leftElement}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'w-full min-w-0 rounded-xl bg-input border transition-all duration-200',
            'placeholder:text-text-secondary',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'hover:border-primary/50',
            'disabled:bg-background disabled:cursor-not-allowed disabled:opacity-50',
            'px-4 py-3 text-text-primary',
            leftIcon && 'pl-10',
            leftElement && 'pl-12',
            rightIcon && 'pr-10',
            rightElement && 'pr-12',
            error && 'border-danger focus:ring-danger/20 focus:border-danger',
            !error && 'border-border',
            className
          )}
          {...props}
        />
        {(rightIcon || rightElement) && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary">
            {rightIcon || rightElement}
          </div>
        )}
        {error && !(rightIcon || rightElement) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
            <svg className="w-5 h-5 text-danger" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
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

export default Input;
export { Input };
