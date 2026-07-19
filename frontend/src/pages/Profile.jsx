import { User, Mail, GraduationCap, IdCard, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Profile</h1>
        <Card className="p-6">
          <p className="text-text-secondary">No user information available.</p>
        </Card>
      </div>
    );
  }

  const roleLabel = (user.role || '').charAt(0).toUpperCase() + (user.role || '').slice(1);

  const fields = [
    { icon: IdCard, label: 'User ID', value: user.id },
    { icon: User, label: 'Name', value: user.name },
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Shield, label: 'Role', value: roleLabel },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Profile</h1>
          <p className="text-text-secondary mt-1">Your account details.</p>
        </div>
        <GraduationCap className="w-6 h-6 text-primary" />
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{user.name}</p>
            <p className="text-text-secondary">{roleLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface"
            >
              <Icon className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-text-secondary uppercase tracking-wider">{label}</p>
                <p className="font-medium text-text-primary truncate">{value ?? '-'}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
