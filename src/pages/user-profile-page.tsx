import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  XCircle,
  UserCircle,
  ShieldCheck,
  Pencil,
  Camera,
  Upload,
  Hash,
  KeyRound,
  Building2,
} from 'lucide-react';
import { getProfile, type ProfileResponse } from '@/service/userService';
import { hrService } from '@/service/hr.service';
import { cn } from '@/lib/utils';
import { getInitials, roleBadgeClass } from './profile/profile-helpers';
import { ProfileOverviewTab } from './profile/ProfileOverviewTab';
import { SecurityTab } from './profile/SecurityTab';
import { EditProfileTab } from './profile/EditProfileTab';

const UserProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageHover, setImageHover] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Photo upload is keyed by the employee record, so it's only available to
  // users linked to an employee (same endpoint the employee profile uses).
  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !profile?.employeeId) return;
    setUploadingImage(true);
    try {
      const url = await hrService.uploadImage(profile.employeeId, file);
      setProfile((prev) => (prev ? { ...prev, imageUrl: url } : prev));
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getProfile(Number(user.id))
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
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
  const canUploadPhoto = !!profile.employeeId;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Hero card — mirrors the employee profile header */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="relative flex flex-col gap-4 bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 px-6 py-5 sm:flex-row sm:items-center">
          {/* Decorative pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Avatar with upload (when linked to an employee) */}
          <div className="relative z-10 w-fit shrink-0">
            <div
              className={cn(
                'relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white shadow-lg',
                canUploadPhoto && 'cursor-pointer',
              )}
              onMouseEnter={() => setImageHover(true)}
              onMouseLeave={() => setImageHover(false)}
              onClick={() => canUploadPhoto && fileInputRef.current?.click()}
            >
              {profile.imageUrl ? (
                <img
                  src={profile.imageUrl}
                  alt={profile.fullName ?? profile.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full select-none items-center justify-center bg-gradient-to-br from-violet-500 to-blue-600 text-2xl font-bold text-white">
                  {initials}
                </div>
              )}
              {canUploadPhoto && (
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-200',
                    imageHover || uploadingImage ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  {uploadingImage ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
              )}
            </div>
            {canUploadPhoto && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md ring-2 ring-white transition-shadow hover:shadow-lg"
                  aria-label="Upload profile photo"
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelected}
                />
              </>
            )}
          </div>

          {/* Name, roles & meta */}
          <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold leading-tight text-white">
                {profile.fullName ?? profile.username}
              </h1>
              <p className="mt-0.5 text-sm text-violet-100">@{profile.username}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {profile.employeeNo && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 font-mono text-xs font-medium text-white ring-1 ring-white/25">
                    <Hash className="h-3 w-3" />
                    {profile.employeeNo}
                  </span>
                )}
                {profile.companyRole && (
                  <span
                    className="inline-flex items-center gap-1 rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700"
                    title="Company role — the role configured for this person within the company"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    {profile.companyRole}
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold',
                    roleBadgeClass(profile.role),
                  )}
                  title="System role — your access level across the application"
                >
                  <KeyRound className="h-3 w-3" />
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Company / Department meta */}
            <div className="flex shrink-0 flex-wrap gap-x-6 gap-y-2">
              {profile.companyName && (
                <div>
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-violet-200">
                    <Building2 className="h-3 w-3" /> Company
                  </p>
                  <p className="text-sm font-semibold text-white">{profile.companyName}</p>
                </div>
              )}
              {profile.departmentName && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-violet-200">
                    Department
                  </p>
                  <p className="text-sm font-semibold text-white">{profile.departmentName}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="h-10 rounded-xl bg-muted/60 p-1">
          <TabsTrigger
            value="overview"
            className="gap-1.5 rounded-lg px-4 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <UserCircle className="h-4 w-4" />
            Profile Overview
          </TabsTrigger>

          {profile.employeeId && (
            <TabsTrigger
              value="edit"
              className="gap-1.5 rounded-lg px-4 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </TabsTrigger>
          )}

          <TabsTrigger
            value="security"
            className="gap-1.5 rounded-lg px-4 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <ProfileOverviewTab profile={profile} roleLabel={roleLabel} />
        </TabsContent>

        {profile.employeeId && (
          <TabsContent value="edit" className="mt-4">
            <EditProfileTab
              profile={profile}
              onSaved={(updated) => setProfile((prev) => prev ? { ...prev, ...updated } : prev)}
            />
          </TabsContent>
        )}

        <TabsContent value="security" className="mt-4">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfilePage;
