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
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <div className="relative min-w-0">
        {(leftIcon || leftElement) && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--color-text-muted)]">
            {leftIcon || leftElement}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'input',
            leftIcon && 'pl-10',
            leftElement && 'pl-12',
            rightIcon && 'pr-10',
            rightElement && 'pr-12',
            error && 'input-error',
            className
          )}
          {...props}
        />
        {(rightIcon || rightElement) && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-text-muted)]">
            {rightIcon || rightElement}
          </div>
        )}
        {error && !(rightIcon || rightElement) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
            <svg className="w-5 h-5 text-[var(--color-danger)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {(error || hint) && (
        <p className={cn('form-error', !error && 'form-hint')}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

export default Input;
export { Input };