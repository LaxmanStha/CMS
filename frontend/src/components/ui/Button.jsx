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
    primary: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 focus:ring-amber-500/30 shadow-sm shadow-amber-500/20 hover:shadow-md hover:shadow-amber-500/30',
    secondary: 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500/30',
    accent: 'bg-amber-500 text-white hover:bg-amber-400 focus:ring-amber-500/30',
    success: 'bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-500/30',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500/30',
    warning: 'bg-amber-500 text-white hover:bg-amber-400 focus:ring-amber-500/30',
    info: 'bg-sky-500 text-white hover:bg-sky-400 focus:ring-sky-500/30',
    outline: 'border border-white/[0.1] text-text-primary hover:bg-white/[0.05] hover:border-white/[0.15] focus:ring-white/10',
    ghost: 'text-text-secondary hover:bg-white/[0.05] hover:text-text-primary focus:ring-white/10',
    link: 'text-amber-500 hover:text-amber-400 hover:bg-transparent focus:ring-amber-500/20 px-0',
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
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0F19]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-[0.97]',
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
