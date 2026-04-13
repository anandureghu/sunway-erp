import { useState, useTransition, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye, EyeOff, Lock, User, Shield, ArrowLeft,
  Building2, Briefcase, Phone, Hash, Mail,
  CheckCircle2, XCircle, KeyRound, IdCard,
  UserCircle, ShieldCheck,
} from 'lucide-react';
import { CHANGE_PASSWORD_SCHEMA } from '@/schema/auth';
import {
  getProfile,
  changePassword,
  type ProfileResponse,
  type ChangePasswordPayload,
} from '@/service/userService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

// ── password strength helpers ─────────────────────────────────────────────────
const getPasswordStrength = (password: string) => {
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

const PwdRule = ({ met, text }: { met: boolean; text: string }) => (
  <li className={cn('flex items-center gap-1.5 text-xs transition-colors',
    met ? 'text-green-600' : 'text-muted-foreground')}>
    {met
      ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
      : <XCircle      className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
    {text}
  </li>
);

// ── role badge colour ─────────────────────────────────────────────────────────
const roleBadgeClass = (role?: string) => {
  switch (role?.toLowerCase()) {
    case 'admin':       return 'bg-red-100    text-red-700    border-red-200';
    case 'hr_manager':
    case 'manager':     return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'supervisor':  return 'bg-amber-100  text-amber-700  border-amber-200';
    default:            return 'bg-blue-100   text-blue-700   border-blue-200';
  }
};

// ── initials helper ───────────────────────────────────────────────────────────
const getInitials = (name?: string, username?: string) => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (username ?? 'U').slice(0, 2).toUpperCase();
};

// ── info row ──────────────────────────────────────────────────────────────────
const InfoRow = ({
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

// ─────────────────────────────────────────────────────────────────────────────
const UserProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profile, setProfile]         = useState<ProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const form = useForm<ChangePasswordPayload>({
    resolver: zodResolver(CHANGE_PASSWORD_SCHEMA),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPwd  = form.watch('newPassword') ?? '';
  const strength = useMemo(() => getPasswordStrength(newPwd), [newPwd]);

  useEffect(() => {
    if (!user?.id) return;
    setLoadingProfile(true);
    getProfile(Number(user.id))
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [user?.id]);

  const onSubmit = (data: ChangePasswordPayload) => {
    if (!user?.id) return;
    startTransition(async () => {
      try {
        await changePassword(Number(user.id), data);
        form.reset();
        toast.success('Password updated successfully!');
      } catch {
        // toast already shown in service
      }
    });
  };

  // ── loading ───────────────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm">Loading your profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <XCircle className="h-8 w-8 text-destructive/60" />
        <p className="text-sm">Failed to load profile. Please refresh the page.</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  const initials  = getInitials(profile.fullName, profile.username);
  const roleLabel = profile.role?.replace(/_/g, ' ') ?? 'User';

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Gradient banner */}
        <div className="relative h-32 bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Avatar + info */}
        <div className="px-6 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="-mt-10 h-20 w-20 ring-4 ring-white shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-600 text-2xl font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="pb-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold leading-tight text-foreground">
                    {profile.fullName ?? profile.username}
                  </h1>
                  <Badge
                    className={cn(
                      'capitalize border text-xs font-semibold',
                      roleBadgeClass(profile.role),
                    )}
                  >
                    {roleLabel}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">@{profile.username}</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-5 pb-1 pl-1 sm:pl-0">
              {profile.employeeNo && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Emp. No.</p>
                  <p className="text-sm font-semibold">{profile.employeeNo}</p>
                </div>
              )}
              {profile.departmentName && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Department</p>
                  <p className="text-sm font-semibold">{profile.departmentName}</p>
                </div>
              )}
              {profile.companyName && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Company</p>
                  <p className="text-sm font-semibold">{profile.companyName}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="overview">
        <TabsList className="h-10 rounded-xl bg-muted/60 p-1">
          <TabsTrigger
            value="overview"
            className="gap-1.5 rounded-lg px-4 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <UserCircle className="h-4 w-4" />
            Profile Overview
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="gap-1.5 rounded-lg px-4 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* ── Overview tab ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">

            {/* Personal Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  Personal Information
                </CardTitle>
                <CardDescription className="text-xs">Your personal account details</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Separator className="mb-1" />
                <div className="divide-y divide-border/50">
                  <InfoRow icon={IdCard} label="Full Name" value={profile.fullName}
                    iconBg="bg-blue-50" iconColor="text-blue-600" />
                  <InfoRow icon={User}   label="Username"  value={profile.username}
                    iconBg="bg-blue-50" iconColor="text-blue-600" />
                  <InfoRow icon={Mail}   label="Email"     value={profile.email}
                    iconBg="bg-blue-50" iconColor="text-blue-600" />
                  <InfoRow icon={Phone}  label="Phone"     value={profile.phoneNo}
                    iconBg="bg-blue-50" iconColor="text-blue-600" />
                </div>
              </CardContent>
            </Card>

            {/* Work Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100">
                    <Building2 className="h-4 w-4 text-purple-600" />
                  </div>
                  Work Information
                </CardTitle>
                <CardDescription className="text-xs">Your company and role details</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Separator className="mb-1" />
                <div className="divide-y divide-border/50">
                  <InfoRow icon={Building2} label="Company"      value={profile.companyName}
                    iconBg="bg-purple-50" iconColor="text-purple-600" />
                  <InfoRow icon={Briefcase} label="Company Role" value={profile.companyRole}
                    iconBg="bg-purple-50" iconColor="text-purple-600" />
                  <InfoRow icon={Hash}      label="Employee No." value={profile.employeeNo}
                    iconBg="bg-purple-50" iconColor="text-purple-600" />
                  <InfoRow icon={KeyRound}  label="System Role"  value={roleLabel}
                    iconBg="bg-purple-50" iconColor="text-purple-600" />
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ── Security tab ─────────────────────────────────────────────────── */}
        <TabsContent value="security" className="mt-4">
          <div className="grid gap-4 md:grid-cols-5">

            {/* Password form — wider column */}
            <Card className="shadow-sm md:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                    <Lock className="h-4 w-4 text-amber-600" />
                  </div>
                  Change Password
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>

              <Separator />

              <CardContent className="pt-5">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                  {/* Current password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword" className="text-sm font-medium">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type={showCurrent ? 'text' : 'password'}
                        placeholder="Enter current password"
                        className="h-10 pl-9 pr-10"
                        {...form.register('currentPassword')}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => setShowCurrent(v => !v)}
                      >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {form.formState.errors.currentPassword && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <XCircle className="h-3.5 w-3.5" />
                        {form.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  {/* New password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-sm font-medium">
                      New Password
                    </Label>
                    <div className="relative">
                      <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showNew ? 'text' : 'password'}
                        placeholder="Enter new password"
                        className="h-10 pl-9 pr-10"
                        {...form.register('newPassword')}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => setShowNew(v => !v)}
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Strength bar */}
                    {newPwd && (
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Password strength</span>
                          <span className={cn('text-xs font-semibold', {
                            'text-red-500':   strength.label === 'Weak',
                            'text-amber-500': strength.label === 'Fair',
                            'text-blue-500':  strength.label === 'Good',
                            'text-green-600': strength.label === 'Strong',
                          })}>
                            {strength.label}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn('h-full rounded-full transition-all duration-300', strength.color)}
                            style={{ width: `${strength.pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {form.formState.errors.newPassword && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <XCircle className="h-3.5 w-3.5" />
                        {form.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        className="h-10 pl-9 pr-10"
                        {...form.register('confirmPassword')}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => setShowConfirm(v => !v)}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {form.formState.errors.confirmPassword && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <XCircle className="h-3.5 w-3.5" />
                        {form.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-10 flex-1 bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md
                                 transition-all hover:from-violet-700 hover:to-blue-700 hover:shadow-lg"
                    >
                      {isPending ? (
                        <>
                          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Updating…
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-1.5 h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10"
                      onClick={() => form.reset()}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Requirements panel */}
            <Card className="h-fit shadow-sm md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-100">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  Password Requirements
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <ul className="space-y-2.5">
                  <PwdRule met={newPwd.length >= 8}       text="At least 8 characters" />
                  <PwdRule met={/[A-Z]/.test(newPwd)}     text="One uppercase letter (A–Z)" />
                  <PwdRule met={/[a-z]/.test(newPwd)}     text="One lowercase letter (a–z)" />
                  <PwdRule met={/[0-9]/.test(newPwd)}     text="One number (0–9)" />
                  <PwdRule met={/[@$!%*?&]/.test(newPwd)} text="One special character (@$!%*?&)" />
                </ul>

                <Separator className="my-4" />

                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-blue-700">Security tip</p>
                  <p className="text-xs leading-relaxed text-blue-600">
                    Use a passphrase with a mix of words, numbers and symbols for a memorable yet strong password.
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfilePage;
