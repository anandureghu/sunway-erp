import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  User, Building2, Briefcase, Phone, Hash, Mail, IdCard, KeyRound,
  CalendarDays, ShieldCheck, ShieldAlert, Sparkles, CheckCircle2,
} from 'lucide-react';
import type { ProfileResponse } from '@/service/userService';
import { InfoRow, StatPill, computeCompleteness } from './profile-helpers';

interface Props {
  profile: ProfileResponse;
  roleLabel: string;
}

/** Format an ISO timestamp as "12 Jan 2024"; undefined when missing/invalid. */
const fmtDate = (iso?: string | null): string | undefined => {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? undefined
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const ProfileOverviewTab = ({ profile, roleLabel }: Props) => {
  const { pct, filled, total, missing } = computeCompleteness(profile);
  const twoFactorOn = !!profile.twoFactorEnabled;

  return (
    <div className="space-y-4 duration-500 animate-in fade-in-50 slide-in-from-bottom-2">
      {/* Profile completeness */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-sm">
              {pct === 100 ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {pct === 100 ? 'Your profile is all set' : 'Complete your profile'}
              </p>
              <p className="text-xs text-muted-foreground">
                {pct === 100
                  ? `All ${total} details are filled in`
                  : `${filled} of ${total} done · add ${missing.slice(0, 2).join(', ')}${missing.length > 2 ? '…' : ''}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:w-64">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-600 transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-sm font-bold tabular-nums text-foreground">
              {pct}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill icon={CalendarDays} label="Member Since" value={fmtDate(profile.createdAt)} tone="violet" />
        <StatPill icon={KeyRound} label="System Role" value={roleLabel} tone="sky" />
        <StatPill
          icon={twoFactorOn ? ShieldCheck : ShieldAlert}
          label="Two-Factor Auth"
          value={twoFactorOn ? 'Enabled' : 'Disabled'}
          tone={twoFactorOn ? 'emerald' : 'amber'}
        />
        <StatPill icon={Hash} label="Employee No." value={profile.employeeNo} tone="slate" />
      </div>

      {/* Detail cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              Personal Information
            </CardTitle>
            <CardDescription className="text-xs">Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="border-t border-border/60 pt-1">
              <InfoRow icon={IdCard} label="Full Name" value={profile.fullName} iconBg="bg-blue-50" iconColor="text-blue-600" />
              <InfoRow icon={User}   label="Username"  value={profile.username} iconBg="bg-blue-50" iconColor="text-blue-600" />
              <InfoRow icon={Mail}   label="Email"     value={profile.email}    iconBg="bg-blue-50" iconColor="text-blue-600" />
              <InfoRow icon={Phone}  label="Phone"     value={profile.phoneNo}  iconBg="bg-blue-50" iconColor="text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              Work Information
            </CardTitle>
            <CardDescription className="text-xs">Your company and role details</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="border-t border-border/60 pt-1">
              <InfoRow icon={Building2}    label="Company"        value={profile.companyName}    iconBg="bg-purple-50" iconColor="text-purple-600" />
              <InfoRow icon={Briefcase}    label="Company Role"   value={profile.companyRole}    iconBg="bg-purple-50" iconColor="text-purple-600" />
              <InfoRow icon={Hash}         label="Employee No."   value={profile.employeeNo}     iconBg="bg-purple-50" iconColor="text-purple-600" />
              <InfoRow icon={KeyRound}     label="System Role"    value={roleLabel}              iconBg="bg-purple-50" iconColor="text-purple-600" />
              <InfoRow icon={CalendarDays} label="Member Since"   value={fmtDate(profile.createdAt)} iconBg="bg-purple-50" iconColor="text-purple-600" />
              <InfoRow icon={ShieldCheck}  label="Two-Factor Auth" value={twoFactorOn ? 'Enabled' : 'Disabled'} iconBg="bg-purple-50" iconColor="text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
