import { FileBarChart } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Reports</h1>
          <p className="text-text-secondary mt-1">Analytics and insights across the institution.</p>
        </div>
        <FileBarChart className="w-6 h-6 text-primary" />
      </div>

      <Card className="p-6">
        <p className="text-text-secondary">Reports dashboard coming soon.</p>
      </Card>
    </div>
  );
}

