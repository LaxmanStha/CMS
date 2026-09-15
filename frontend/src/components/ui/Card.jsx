import { memo } from 'react';
import { cn } from '@/lib/utils';

const Card = memo(({
  className,
  children,
  hover = false,
  padding = 'p-6',
  border = true,
  shadow = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'card',
        hover && 'card-hover',
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
  <h3 className={cn('text-lg font-semibold text-[var(--color-text)]', className)} {...props}>
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = memo(({ className, children, ...props }) => (
  <p className={cn('text-[var(--color-text-muted)] text-sm mt-1', className)} {...props}>
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
  <div className={cn('mt-4 pt-4 border-t border-[var(--color-border)] flex items-center gap-3', className)} {...props}>
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