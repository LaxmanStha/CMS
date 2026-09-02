import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PageHeader = ({ title, subtitle, children, breadcrumbs, className }) => (
  <div className={cn('mb-6 flex flex-col gap-4', className)}>
    {breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && (
      <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-xs text-text-secondary">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 text-text-tertiary" />}
            {crumb.to ? (
              <Link to={crumb.to} className="hover:text-text-primary transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className={i === breadcrumbs.length - 1 ? 'text-text-primary' : 'text-text-secondary'}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    )}
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  </div>
);

export default PageHeader;
export { PageHeader };