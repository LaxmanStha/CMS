import { memo } from 'react';
import { cn } from '@/lib/utils';

const Card = memo(({
  className,
  children,
  hover = false,
  padding = 'p-6',
  border = true,
  shadow = 'card',
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-card rounded-2xl transition-all duration-300',
        border && 'border border-border',
        shadow && `shadow-${shadow}`,
        hover && 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer',
        padding,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = 'Card';

const CardHeader = memo(({ className, children, ...props }) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = memo(({ className, children, ...props }) => (
  <h3 className={cn('text-xl font-semibold text-text-primary', className)} {...props}>
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = memo(({ className, children, ...props }) => (
  <p className={cn('text-text-secondary text-sm mt-1', className)} {...props}>
    {children}
  </p>
));
CardDescription.displayName = 'CardDescription';

const CardContent = memo(({ className, children, ...props }) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
));
CardContent.displayName = 'CardContent';

const CardFooter = memo(({ className, children, ...props }) => (
  <div className={cn('mt-4 pt-4 border-t border-border flex items-center gap-3', className)} {...props}>
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
export { Card };
