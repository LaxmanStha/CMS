import { Settings as SettingsIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-1">Manage your application preferences.</p>
        </div>
        <SettingsIcon className="w-6 h-6 text-primary" />
      </div>

      <Card className="p-6">
        <p className="text-text-secondary">Settings panel coming soon.</p>
      </Card>
    </div>
  );
}

