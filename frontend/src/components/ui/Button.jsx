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
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    success: 'btn-success',
    warning: 'btn-warning',
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs gap-1',
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
    xl: 'btn-xl',
    icon: 'btn-icon',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'btn',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        ripple && 'relative overflow-hidden',
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