import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  XCircle,
  UserCircle,
  ShieldCheck,
  Pencil,
  Camera,
  Upload,
  KeyRound,
  Briefcase,
  Mail,
  Phone,
  IdCard,
  MoreHorizontal,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { getProfile, type ProfileResponse } from '@/service/userService';
import { hrService } from '@/service/hr.service';
import { cn } from '@/lib/utils';
import { getInitials, roleBadgeClass } from './profile/profile-helpers';
import { ProfileOverviewTab } from './profile/ProfileOverviewTab';
import { SecurityTab } from './profile/SecurityTab';
import { EditProfileTab } from './profile/EditProfileTab';

/** One inline contact item in the bar below the banner. */
const ContactItem = ({
  icon: Icon,
  value,
  href,
}: {
  icon: React.ElementType;
  value?: string | null;
  href?: string;
}) => {
  if (!value) return null;
  const inner = (
    <span className="inline-flex items-center gap-2 text-sm text-slate-600">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="truncate">{value}</span>
    </span>
  );
  return href ? (
    <a href={href} className="transition-colors hover:text-blue-600">
      {inner}
    </a>
  ) : (
    inner
  );
};

/** One labelled column in the meta strip. */
const MetaCol = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-0.5 truncate text-sm font-medium text-slate-700" title={value ?? undefined}>
      {value || '—'}
    </p>
  </div>
);

const UserProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [designation, setDesignation] = useState<string | null>(null);
  const [nationality, setNationality] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
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

  // Enrich the banner with the employee's job title + nationality (not carried
  // by the lightweight profile payload).
  useEffect(() => {
    if (!profile?.employeeId) return;
    let mounted = true;
    hrService
      .getEmployee(profile.employeeId)
      .then((emp: any) => {
        if (!mounted || !emp) return;
        setDesignation(emp.designation ?? emp.companyRole ?? null);
        setNationality(emp.nationality ?? null);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [profile?.employeeId]);

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
  const jobTitle = designation ?? profile.companyRole ?? null;

  const memberSince = (() => {
    if (!profile.createdAt) return undefined;
    const d = new Date(profile.createdAt);
    return Number.isNaN(d.getTime())
      ? undefined
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  })();

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 duration-500 animate-in fade-in-50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/')}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Banner profile card */}
      <Card className="overflow-hidden border shadow-sm">
        {/* Cover banner with avatar + identity */}
        <div className="relative h-44 bg-gradient-to-r from-slate-900 via-violet-800 to-blue-700 sm:h-48">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

          <div className="absolute inset-0 flex items-center gap-5 px-6 sm:px-8">
            {/* Avatar with upload */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  'relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-xl sm:h-28 sm:w-28',
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
                  <div className="flex h-full w-full select-none items-center justify-center bg-gradient-to-br from-violet-500 to-blue-600 text-3xl font-bold text-white">
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
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md ring-2 ring-white transition-shadow hover:shadow-lg"
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

            {/* Name, badge & title */}
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="truncate text-2xl font-bold leading-tight text-white drop-shadow-sm sm:text-[26px]">
                  {profile.fullName ?? profile.username}
                </h1>
                {nationality && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500 px-1.5 py-0.5 text-[11px] font-bold uppercase text-white shadow-sm">
                    <Globe className="h-3 w-3" />
                    {nationality.slice(0, 12)}
                  </span>
                )}
              </div>
              {jobTitle && (
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-white/85">
                  <Briefcase className="h-3.5 w-3.5" />
                  {jobTitle}
                </p>
              )}
              <p className="mt-0.5 text-xs text-white/70">@{profile.username}</p>
            </div>
          </div>
        </div>

        {/* Contact bar */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-slate-100 bg-card px-6 py-3.5 sm:px-8">
          <ContactItem icon={Mail} value={profile.email} href={profile.email ? `mailto:${profile.email}` : undefined} />
          <ContactItem icon={Phone} value={profile.phoneNo} href={profile.phoneNo ? `tel:${profile.phoneNo}` : undefined} />
          <ContactItem icon={IdCard} value={profile.employeeNo} />
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

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Profile actions"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {profile.employeeId && (
                  <DropdownMenuItem onClick={() => setActiveTab('edit')} className="gap-2">
                    <Pencil className="h-4 w-4" /> Edit Profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setActiveTab('security')} className="gap-2">
                  <ShieldCheck className="h-4 w-4" /> Security
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.reload()} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Refresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-2 gap-4 bg-card px-6 py-4 sm:grid-cols-4 sm:px-8">
          <MetaCol label="Business Unit" value={profile.companyName} />
          <MetaCol label="Department" value={profile.departmentName} />
          <MetaCol label="Company Role" value={profile.companyRole} />
          <MetaCol label="Member Since" value={memberSince} />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="gap-1.5 rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            <UserCircle className="h-4 w-4" />
            Overview
          </TabsTrigger>

          {profile.employeeId && (
            <TabsTrigger
              value="edit"
              className="gap-1.5 rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </TabsTrigger>
          )}

          <TabsTrigger
            value="security"
            className="gap-1.5 rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
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
              onSaved={(updated) => setProfile((prev) => (prev ? { ...prev, ...updated } : prev))}
            />
          </TabsContent>
        )}

        <TabsContent value="security" className="mt-4">
          <SecurityTab
            twoFactorEnabled={profile.twoFactorEnabled ?? false}
            onTwoFactorChange={(enabled) =>
              setProfile((prev) => (prev ? { ...prev, twoFactorEnabled: enabled } : prev))
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfilePage;
