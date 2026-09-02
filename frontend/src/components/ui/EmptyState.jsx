import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';

const EmptyState = ({ title = 'No data yet', description, icon: Icon = FileText, action, className }) => (
  <div className={cn('empty-state', className)}>
    <div className="empty-state-icon">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="empty-state-title">{title}</h3>
    {description && <p className="empty-state-description">{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

export default EmptyState;
export { EmptyState };