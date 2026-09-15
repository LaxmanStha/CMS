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
    default: 'badge-gray',
    primary: 'badge-primary',
    secondary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-primary',
    outline: 'badge-gray',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-sm gap-2',
  };

  return (
    <span
      className={cn(
        'badge',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-current" />}
      {children}
    </span>
  );
});
Badge.displayName = 'Badge';

export default Badge;
export { Badge };