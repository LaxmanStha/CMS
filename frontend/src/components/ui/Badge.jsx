import { memo } from 'react';
import { cn } from '@/lib/utils';

const Badge = memo(({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
  ...props
}) => {
  const variants = {
    default: 'bg-white/[0.06] text-text-secondary border-white/[0.08]',
    primary: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    secondary: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20',
    info: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    outline: 'border border-white/[0.1] bg-transparent text-text-secondary',
    glass: 'bg-white/[0.05] backdrop-blur-sm text-text-primary border-white/[0.1]',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const dotColors = {
    default: 'bg-gray-400',
    primary: 'bg-amber-500',
    secondary: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    outline: 'bg-text-secondary',
    glass: 'bg-primary',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full transition-colors border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
{children}
    </span>
  );
});
Badge.displayName = 'Badge';

export default Badge;
export { Badge };
