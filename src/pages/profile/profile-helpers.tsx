import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: '', color: '', pct: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;
  if (score <= 2) return { score, label: 'Weak',   color: 'bg-red-500',   pct: 25 };
  if (score <= 3) return { score, label: 'Fair',   color: 'bg-amber-500', pct: 50 };
  if (score <= 4) return { score, label: 'Good',   color: 'bg-blue-500',  pct: 75 };
  return              { score, label: 'Strong', color: 'bg-green-500', pct: 100 };
};

export const roleBadgeClass = (role?: string) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'hr_manager':
    case 'manager':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'supervisor':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

export const getInitials = (name?: string | null, username?: string | null) => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (username ?? 'U').slice(0, 2).toUpperCase();
};

export const PwdRule = ({ met, text }: { met: boolean; text: string }) => (
  <li className={cn('flex items-center gap-1.5 text-xs transition-colors',
    met ? 'text-green-600' : 'text-muted-foreground')}>
    {met
      ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
      : <XCircle      className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
    {text}
  </li>
);

export const InfoRow = ({
  icon: Icon,
  label,
  value,
  iconBg = 'bg-primary/8',
  iconColor = 'text-primary',
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  iconBg?: string;
  iconColor?: string;
}) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3">
      <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconBg)}>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
};
