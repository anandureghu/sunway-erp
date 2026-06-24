import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PhoneInput from '@/components/PhoneInput';
import { validatePhone } from '@/lib/countries';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  User, Phone, IdCard, Heart, Calendar, MapPin, Globe, BookOpen, Save, RotateCcw,
} from 'lucide-react';
import { hrService, type UpdateEmployeePayload } from '@/service/hr.service';
import type { ProfileResponse } from '@/service/userService';

type EditFields = {
  firstName: string;
  lastName: string;
  phoneNo: string;
  gender: string;
  maritalStatus: string;
  dateOfBirth: string;
  nationality: string;
  religion: string;
  birthplace: string;
  hometown: string;
  identification: string;
  notes: string;
};

interface Props {
  profile: ProfileResponse;
  onSaved: (updated: Partial<ProfileResponse>) => void;
}

export const EditProfileTab = ({ profile, onSaved }: Props) => {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, control, formState: { isDirty } } = useForm<EditFields>({
    defaultValues: {
      firstName:      profile.firstName      ?? '',
      lastName:       profile.lastName       ?? '',
      phoneNo:        profile.phoneNo        ?? '',
      gender:         '',
      maritalStatus:  '',
      dateOfBirth:    '',
      nationality:    '',
      religion:       '',
      birthplace:     '',
      hometown:       '',
      identification: '',
      notes:          '',
    },
  });

  // The lightweight ProfileResponse only carries name/phone, so the rest of the
  // fields would render blank. Pull the full employee record and pre-fill the
  // form with the employee's existing data so they can see and edit it.
  useEffect(() => {
    if (!profile.employeeId) return;
    let mounted = true;
    const up = (s?: string | null) => (s ? String(s).toUpperCase() : '');
    hrService
      .getEmployee(profile.employeeId)
      .then((emp: any) => {
        if (!mounted || !emp) return;
        reset({
          firstName:      emp.firstName      ?? profile.firstName ?? '',
          lastName:       emp.lastName       ?? profile.lastName  ?? '',
          phoneNo:        emp.phoneNo        ?? profile.phoneNo   ?? '',
          gender:         up(emp.gender),
          maritalStatus:  up(emp.maritalStatus),
          dateOfBirth:    (emp.dateOfBirth ?? '').slice(0, 10),
          nationality:    emp.nationality    ?? '',
          religion:       emp.religion       ?? '',
          birthplace:     emp.birthplace     ?? '',
          hometown:       emp.hometown       ?? '',
          identification: emp.identification ?? '',
          notes:          emp.notes          ?? '',
        });
      })
      .catch(() => {
        /* keep name/phone defaults if the full record can't be loaded */
      });
    return () => {
      mounted = false;
    };
  }, [profile.employeeId, reset, profile.firstName, profile.lastName, profile.phoneNo]);

  const onSubmit = async (data: EditFields) => {
    if (!profile.employeeId) return;
    const phoneCheck = validatePhone(data.phoneNo, { required: false });
    if (!phoneCheck.valid) {
      toast.error(phoneCheck.message ?? 'Invalid phone number');
      return;
    }
    setSaving(true);
    try {
      const payload: UpdateEmployeePayload = {
        firstName:      data.firstName      || undefined,
        lastName:       data.lastName       || undefined,
        phoneNo:        data.phoneNo        || undefined,
        gender:         data.gender         || undefined,
        maritalStatus:  data.maritalStatus  || undefined,
        dateOfBirth:    data.dateOfBirth    || undefined,
        nationality:    data.nationality    || undefined,
        religion:       data.religion       || undefined,
        birthplace:     data.birthplace     || undefined,
        hometown:       data.hometown       || undefined,
        identification: data.identification || undefined,
        notes:          data.notes          || undefined,
      };
      await hrService.updateEmployee(profile.employeeId, payload);
      toast.success('Profile updated successfully');

      const firstName = data.firstName || (profile.firstName ?? '');
      const lastName  = data.lastName  || (profile.lastName  ?? '');
      onSaved({
        firstName,
        lastName,
        phoneNo:  data.phoneNo || profile.phoneNo,
        fullName: `${firstName} ${lastName}`.trim(),
      });
      reset(data);
    } catch {
      // toast shown by service
    } finally {
      setSaving(false);
    }
  };

  const textField = (
    label: string,
    name: keyof EditFields,
    icon: React.ElementType,
    type = 'text',
    placeholder = '',
  ) => {
    const Icon = icon;
    return (
      <div className="space-y-1.5">
        <Label htmlFor={name} className="flex items-center gap-1.5 text-sm font-medium">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </Label>
        <Input
          id={name}
          type={type}
          placeholder={placeholder || label}
          className="h-10"
          {...register(name)}
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Basic details */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100">
              <User className="h-4 w-4 text-violet-600" />
            </div>
            Basic Details
          </CardTitle>
          <CardDescription className="text-xs">Your name and contact information</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          {textField('First Name',   'firstName',      IdCard,   'text', 'John')}
          {textField('Last Name',    'lastName',       IdCard,   'text', 'Doe')}
          <div className="space-y-1.5">
            <Label htmlFor="phoneNo" className="flex items-center gap-1.5 text-sm font-medium">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              Phone Number
            </Label>
            <Controller
              name="phoneNo"
              control={control}
              render={({ field, fieldState }) => (
                <PhoneInput
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!fieldState.error}
                  className="h-10"
                />
              )}
            />
          </div>
          {textField('National ID',  'identification', BookOpen, 'text', 'ID / Passport number')}
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
              <Heart className="h-4 w-4 text-blue-600" />
            </div>
            Personal Information
          </CardTitle>
          <CardDescription className="text-xs">Background and demographics</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          {/* Gender */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Gender
            </Label>
            <Controller
              name="gender"
              control={control}
              render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                    <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Marital status */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Heart className="h-3.5 w-3.5 text-muted-foreground" />
              Marital Status
            </Label>
            <Controller
              name="maritalStatus"
              control={control}
              render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Single</SelectItem>
                    <SelectItem value="MARRIED">Married</SelectItem>
                    <SelectItem value="DIVORCED">Divorced</SelectItem>
                    <SelectItem value="WIDOWED">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {textField('Date of Birth', 'dateOfBirth', Calendar, 'date')}
          {textField('Nationality',   'nationality', Globe,    'text', 'e.g. Indian')}
          {textField('Religion',      'religion',    BookOpen, 'text', 'e.g. Hindu')}
          {textField('Birthplace',    'birthplace',  MapPin,   'text', 'City, Country')}
          {textField('Hometown',      'hometown',    MapPin,   'text', 'City, Country')}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
              <BookOpen className="h-4 w-4 text-amber-600" />
            </div>
            Notes
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <textarea
            {...register('notes')}
            placeholder="Any additional notes about yourself…"
            rows={3}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          onClick={() => reset()}
          disabled={!isDirty || saving}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button
          type="submit"
          disabled={saving || !isDirty}
          className="gap-1.5 bg-linear-to-r from-violet-600 to-blue-600 text-white shadow-md hover:from-violet-700 hover:to-blue-700"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
