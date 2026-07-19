import { cn } from '@/lib/utils';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className, 
  dot = false,
  ...props 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    primary: 'bg-badge-blue text-primary dark:bg-primary/20 dark:text-primary-light',
    secondary: 'bg-badge-green text-secondary dark:bg-secondary/20 dark:text-secondary-light',
    success: 'bg-badge-green text-success dark:bg-success/20 dark:text-success-light',
    warning: 'bg-badge-yellow text-accent dark:bg-accent/20 dark:text-accent-light',
    danger: 'bg-badge-red text-danger dark:bg-danger/20 dark:text-danger-light',
    info: 'bg-info/10 text-info dark:bg-info/20',
    outline: 'border border-border bg-transparent',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const dotColors = {
    default: 'bg-gray-400',
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-accent',
    danger: 'bg-danger',
    info: 'bg-info',
    outline: 'bg-text-secondary',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full transition-colors',
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
};

export default Badge;
export { Badge };
