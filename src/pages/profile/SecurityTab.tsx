import { useState, useTransition, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Lock, Shield, CheckCircle2, XCircle, KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CHANGE_PASSWORD_SCHEMA } from '@/schema/auth';
import { changePassword, type ChangePasswordPayload } from '@/service/userService';
import { cn } from '@/lib/utils';
import { getPasswordStrength, PwdRule } from './profile-helpers';

export const SecurityTab = () => {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ChangePasswordPayload>({
    resolver: zodResolver(CHANGE_PASSWORD_SCHEMA),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPwd   = form.watch('newPassword') ?? '';
  const strength = useMemo(() => getPasswordStrength(newPwd), [newPwd]);

  const onSubmit = (data: ChangePasswordPayload) => {
    if (!user?.id) return;
    startTransition(async () => {
      try {
        await changePassword(Number(user.id), data);
        form.reset();
        toast.success('Password updated successfully!');
      } catch {
        // toast shown in service
      }
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {/* Password form */}
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
              <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
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
              <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
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
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
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
                className="h-10 flex-1 bg-linear-to-r from-violet-600 to-blue-600 text-white shadow-md transition-all hover:from-violet-700 hover:to-blue-700 hover:shadow-lg"
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
              <Button type="button" variant="outline" className="h-10" onClick={() => form.reset()}>
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
  );
};
