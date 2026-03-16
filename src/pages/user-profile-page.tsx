import { useState, useTransition, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, User, Shield, ArrowLeft,
         Building2, Briefcase, Phone, Hash } from 'lucide-react';
import { CHANGE_PASSWORD_SCHEMA } from '@/schema/auth';
import {
  getProfile,
  changePassword,
  type ProfileResponse,
  type ChangePasswordPayload,
} from '@/service/userService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const UserProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── real data from backend ────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const form = useForm<ChangePasswordPayload>({
    resolver: zodResolver(CHANGE_PASSWORD_SCHEMA),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // ── fetch from backend on mount ───────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      console.warn('user.id is missing:', user);
      return;
    }
    console.log('Fetching profile for userId:', user.id);
    setLoadingProfile(true);
    getProfile(Number(user.id))
      .then((data) => {
        console.log('Profile loaded:', data);
        setProfile(data);
      })
      .catch((err) => {
        console.error('Profile fetch error:', err);
      })
      .finally(() => setLoadingProfile(false));
  }, [user?.id]);

  const onSubmit = (data: ChangePasswordPayload) => {
    if (!user?.id) return;
    startTransition(async () => {
      try {
        await changePassword(Number(user.id), data);
        form.reset();
        setShowPasswordSection(false);
        toast.success('Password updated successfully!');
      } catch {
        // toast already shown in service
      }
    });
  };

  // ── loading state ─────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-3 text-slate-400">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        <span className="text-sm">Loading profile…</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-slate-400">
        <span className="text-sm">Failed to load profile. Please refresh.</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* ── Profile card ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            My Profile
          </CardTitle>
          <CardDescription>View and manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {profile.fullName && (
              <div>
                <Label className="text-sm font-medium text-slate-700">Full Name</Label>
                <p className="mt-1 text-lg font-semibold">{profile.fullName}</p>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium text-slate-700">Username</Label>
              <p className="mt-1 text-lg font-semibold">{profile.username}</p>
            </div>

            {profile.email && (
              <div>
                <Label className="text-sm font-medium text-slate-700">Email</Label>
                <p className="mt-1 text-lg font-semibold">{profile.email}</p>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium text-slate-700">Role</Label>
              <p className="mt-1 text-lg font-semibold capitalize">
                {profile.role?.replace('_', ' ') || 'User'}
              </p>
            </div>

            {profile.companyRole && (
              <div>
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" /> Company Role
                </Label>
                <p className="mt-1 text-lg font-semibold">{profile.companyRole}</p>
              </div>
            )}

            {profile.employeeNo && (
              <div>
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5" /> Employee No
                </Label>
                <p className="mt-1 text-lg font-semibold">{profile.employeeNo}</p>
              </div>
            )}

            {profile.phoneNo && (
              <div>
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </Label>
                <p className="mt-1 text-lg font-semibold">{profile.phoneNo}</p>
              </div>
            )}

            {profile.companyName && (
              <div>
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> Company
                </Label>
                <p className="mt-1 text-lg font-semibold">{profile.companyName}</p>
              </div>
            )}

            {profile.departmentName && (
              <div>
                <Label className="text-sm font-medium text-slate-700">Department</Label>
                <p className="mt-1 text-lg font-semibold">{profile.departmentName}</p>
              </div>
            )}

          </div>

          <Button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            variant={showPasswordSection ? 'secondary' : 'default'}
            className="flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            {showPasswordSection ? 'Cancel' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Password card ── */}
      {showPasswordSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Change Password
            </CardTitle>
            <CardDescription>
              Enter your current password and new password to update.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="relative">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="currentPassword"
                      type={showCurrent ? 'text' : 'password'}
                      {...form.register('currentPassword')}
                      className="pr-10"
                    />
                    <Button type="button" variant="ghost" size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setShowCurrent(!showCurrent)}>
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {form.formState.errors.currentPassword && (
                    <p className="mt-1 text-sm text-destructive">
                      {form.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      {...form.register('newPassword')}
                      className="pr-10"
                    />
                    <Button type="button" variant="ghost" size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setShowNew(!showNew)}>
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {form.formState.errors.newPassword && (
                    <p className="mt-1 text-sm text-destructive">
                      {form.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 relative">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      {...form.register('confirmPassword')}
                      className="pr-10"
                    />
                    <Button type="button" variant="ghost" size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm
                        ? <EyeOff className="h-4 w-4" />
                        : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-destructive">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? 'Updating...' : 'Update Password'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setShowPasswordSection(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserProfilePage;