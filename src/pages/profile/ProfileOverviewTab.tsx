import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Building2, Briefcase, Phone, Hash, Mail, IdCard, KeyRound } from 'lucide-react';
import type { ProfileResponse } from '@/service/userService';
import { InfoRow } from './profile-helpers';

interface Props {
  profile: ProfileResponse;
  roleLabel: string;
}

export const ProfileOverviewTab = ({ profile, roleLabel }: Props) => (
  <div className="grid gap-4 md:grid-cols-2">
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
          <InfoRow icon={IdCard} label="Full Name" value={profile.fullName}   iconBg="bg-blue-50" iconColor="text-blue-600" />
          <InfoRow icon={User}   label="Username"  value={profile.username}   iconBg="bg-blue-50" iconColor="text-blue-600" />
          <InfoRow icon={Mail}   label="Email"     value={profile.email}      iconBg="bg-blue-50" iconColor="text-blue-600" />
          <InfoRow icon={Phone}  label="Phone"     value={profile.phoneNo}    iconBg="bg-blue-50" iconColor="text-blue-600" />
        </div>
      </CardContent>
    </Card>

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
          <InfoRow icon={Building2} label="Company"      value={profile.companyName}  iconBg="bg-purple-50" iconColor="text-purple-600" />
          <InfoRow icon={Briefcase} label="Company Role" value={profile.companyRole}  iconBg="bg-purple-50" iconColor="text-purple-600" />
          <InfoRow icon={Hash}      label="Employee No." value={profile.employeeNo}   iconBg="bg-purple-50" iconColor="text-purple-600" />
          <InfoRow icon={KeyRound}  label="System Role"  value={roleLabel}            iconBg="bg-purple-50" iconColor="text-purple-600" />
        </div>
      </CardContent>
    </Card>
  </div>
);
