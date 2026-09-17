import { User, Mail, IdCard, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p style={{ color: 'var(--color-text-muted)' }}>No user information available.</p>
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
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{user.name}</p>
            <p style={{ color: 'var(--color-text-muted)' }}>{roleLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{value ?? '-'}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}