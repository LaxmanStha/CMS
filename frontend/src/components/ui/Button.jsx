import { cn } from '@/lib/utils';

const Button = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled = false,
  ripple = true,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  type = 'button',
  onClick,
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary/50',
    secondary: 'bg-secondary text-white hover:bg-secondary-hover focus:ring-secondary/50',
    accent: 'bg-accent text-white hover:bg-accent-hover focus:ring-accent/50',
    success: 'bg-success text-white hover:bg-success-hover focus:ring-success/50',
    danger: 'bg-danger text-white hover:bg-danger-hover focus:ring-danger/50',
    warning: 'bg-warning text-white hover:bg-warning-hover focus:ring-warning/50',
    info: 'bg-info text-white hover:bg-info-hover focus:ring-info/50',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary/50',
    ghost: 'text-text-secondary hover:bg-hover hover:text-text-primary focus:ring-text-secondary/50',
    link: 'text-primary hover:text-primary-hover hover:bg-transparent focus:ring-primary/50 px-0',
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
    xl: 'px-9 py-4 text-lg gap-3',
    icon: 'p-2.5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-button transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-[0.98]',
        'rounded-xl',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        ripple && 'btn-ripple relative overflow-hidden',
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          <span className={cn('truncate', loading && 'opacity-0')}>{children}</span>
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
export { Button };
