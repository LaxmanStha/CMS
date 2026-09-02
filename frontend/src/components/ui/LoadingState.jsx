import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ label = 'Loading...', className, size = 'md' }) => {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-text-secondary', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      <span className="text-sm">{label}</span>
    </div>
  );
};

export default LoadingState;
export { LoadingState };