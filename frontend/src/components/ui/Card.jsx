import { cn } from '@/lib/utils';

const Card = ({ 
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
};

const CardHeader = ({ className, children, ...props }) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn('text-xl font-semibold text-text-primary', className)} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ className, children, ...props }) => (
  <p className={cn('text-text-secondary text-sm mt-1', className)} {...props}>
    {children}
  </p>
);

const CardContent = ({ className, children, ...props }) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);

const CardFooter = ({ className, children, ...props }) => (
  <div className={cn('mt-4 pt-4 border-t border-border flex items-center gap-3', className)} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
export { Card };
