import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, XCircle, UserCircle, ShieldCheck, Pencil } from 'lucide-react';
import { getProfile, type ProfileResponse } from '@/service/userService';
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

      {/* Hero card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="relative h-32 bg-linear-to-r from-violet-600 via-purple-600 to-blue-600">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="px-6 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="-mt-10 h-20 w-20 ring-4 ring-white shadow-xl">
                <AvatarFallback className="bg-linear-to-br from-violet-500 to-blue-600 text-2xl font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="pb-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold leading-tight text-foreground">
                    {profile.fullName ?? profile.username}
                  </h1>
                  <Badge className={cn('capitalize border text-xs font-semibold', roleBadgeClass(profile.role))}>
                    {roleLabel}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">@{profile.username}</p>
              </div>
            </div>

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
