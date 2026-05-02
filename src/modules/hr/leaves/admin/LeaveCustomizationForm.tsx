import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  RefreshCw,
  Plus,
  Minus,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  Zap,
  Lock,
  Loader2,
  Info,
} from "lucide-react";
import { type LeavePolicy, type LeaveType } from "@/types/hr";
import { leavePolicyService } from "@/service/leavePolicyService";
import { roleService, type RoleResponse } from "@/service/roleService";
import { useAuth } from "@/context/AuthContext";

// Default leave types (fallback when API fails)
const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Unpaid Leave",
  "Maternity Leave",
];

// Dynamic roles type
interface RoleOption {
  key: string;
  label: string;
  color?: { bg: string; text: string };
}

// Empty array as default - will be populated from API
const DEFAULT_ROLES: RoleOption[] = [];

// Predefined color palette for dynamic role coloring
const ROLE_COLOR_PALETTE = [
  { bg: "bg-purple-100 text-purple-700", text: "text-purple-700" },
  { bg: "bg-indigo-100 text-indigo-700", text: "text-indigo-700" },
  { bg: "bg-pink-100 text-pink-700", text: "text-pink-700" },
  { bg: "bg-blue-100 text-blue-700", text: "text-blue-700" },
  { bg: "bg-green-100 text-green-700", text: "text-green-700" },
  { bg: "bg-emerald-100 text-emerald-700", text: "text-emerald-700" },
  { bg: "bg-amber-100 text-amber-700", text: "text-amber-700" },
  { bg: "bg-orange-100 text-orange-700", text: "text-orange-700" },
  { bg: "bg-teal-100 text-teal-700", text: "text-teal-700" },
  { bg: "bg-cyan-100 text-cyan-700", text: "text-cyan-700" },
  { bg: "bg-rose-100 text-rose-700", text: "text-rose-700" },
  { bg: "bg-fuchsia-100 text-fuchsia-700", text: "text-fuchsia-700" },
  { bg: "bg-sky-100 text-sky-700", text: "text-sky-700" },
  { bg: "bg-violet-100 text-violet-700", text: "text-violet-700" },
  { bg: "bg-slate-100 text-slate-700", text: "text-slate-700" },
];

// Generate consistent color based on role name
const getRoleColor = (roleName: string): { bg: string; text: string } => {
  let hash = 0;
  for (let i = 0; i < roleName.length; i++) {
    hash = roleName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ROLE_COLOR_PALETTE.length;
  return ROLE_COLOR_PALETTE[index];
};

const LEAVE_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  "Annual Leave": { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: "text-blue-500" },
  "Sick Leave": { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: "text-red-500" },
  "Emergency Leave": { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", icon: "text-orange-500" },
  "Unpaid Leave": { bg: "bg-gray-50 border-gray-200", text: "text-gray-700", icon: "text-gray-500" },
  "Maternity Leave": { bg: "bg-pink-50 border-pink-200", text: "text-pink-700", icon: "text-pink-500" },
};

type Gender = "MALE" | "FEMALE" | "OTHER";

interface LeaveTypeGenderConfig {
  type: string;
  applicableGenders: Gender[];
  isGenderRestricted: boolean;
}

const LEAVE_TYPE_GENDER_CONFIG: LeaveTypeGenderConfig[] = [
  { type: "Annual Leave", applicableGenders: ["MALE", "FEMALE", "OTHER"], isGenderRestricted: false },
  { type: "Sick Leave", applicableGenders: ["MALE", "FEMALE", "OTHER"], isGenderRestricted: false },
  { type: "Emergency Leave", applicableGenders: ["MALE", "FEMALE", "OTHER"], isGenderRestricted: false },
  { type: "Unpaid Leave", applicableGenders: ["MALE", "FEMALE", "OTHER"], isGenderRestricted: false },
  { type: "Maternity Leave", applicableGenders: ["FEMALE"], isGenderRestricted: true },
];

// Convert RoleResponse to our format with dynamic colors
const convertRolesFromApi = (roles: RoleResponse[]): RoleOption[] => {
  return roles.map(role => ({
    key: role.name,
    label: role.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    color: getRoleColor(role.name),
  }));
};

export default function LeaveCustomizationForm() {
  const { company } = useAuth();

  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedPolicies, setSavedPolicies] = useState<LeavePolicy[]>([]);
  
  const [roles, setRoles] = useState<RoleOption[]>(DEFAULT_ROLES);
  const [rolesLoading, setRolesLoading] = useState(true);
  
  const [leaveTypes, setLeaveTypes] = useState<string[]>(DEFAULT_LEAVE_TYPES);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(true);

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<Gender>("FEMALE");

useEffect(() => {
    const fetchRoles = async () => {
      try {
        if (!company?.id) {
          console.warn("No company ID available for fetching roles");
          setRolesLoading(false);
          return;
        }

        const response = await roleService.getRoles(company.id);
        
        // Log the response for debugging
        console.log("Roles API response:", response);
        console.log("Roles data length:", response?.length);

        if (response && Array.isArray(response) && response.length > 0) {
          setRoles(convertRolesFromApi(response));
        } else {
          console.warn("No roles returned from API, using defaults");
        }
      } catch (error: any) {
        console.error("Failed to fetch roles:", error?.response?.data ?? error.message);
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, [company?.id]);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        if (!company?.id) {
          console.warn("No company ID available for fetching leave types");
          setLeaveTypesLoading(false);
          return;
        }

        const response = await leavePolicyService.getLeaveTypes(company.id);
        
        // Log the response for debugging
        console.log("Leave types API response:", response);
        console.log("Leave types data:", response.data);

        if (response.data && Array.isArray(response.data)) {
          const normalizedLeaveTypes = response.data
            .map((lt: any) => (typeof lt === "string" ? lt : lt?.name))
            .filter((lt: string | undefined): lt is string => typeof lt === "string");

          if (normalizedLeaveTypes.length > 0) {
            setLeaveTypes(normalizedLeaveTypes);
          } else {
            console.warn("No leave types returned from API, using defaults");
          }
        } else {
          console.warn("No leave types returned from API, using defaults");
        }
      } catch (error: any) {
        console.error("Failed to fetch leave types:", error?.response?.data ?? error.message);
      } finally {
        setLeaveTypesLoading(false);
      }
    };
    fetchLeaveTypes();
  }, [company?.id]);

  useEffect(() => {
    if (!company?.id || rolesLoading || leaveTypesLoading) return;

    const loadPolicies = async () => {
      setLoading(true);
      try {
        const response = await leavePolicyService.getPolicies(company.id);
        const saved = response.data || [];

        const fullMatrix: LeavePolicy[] = [];

        roles.forEach((role) => {
          leaveTypes.forEach((leaveType) => {
            const existing = saved.find(
              (p: LeavePolicy) => p.role === role.key && p.leaveType === leaveType,
            );

            fullMatrix.push({
              role: role.key,
              leaveType: leaveType as LeaveType,
              daysAllowed: existing ? existing.defaultDays : 0,
              includeWeekends: existing?.includeWeekends ?? false,
            });
          });
        });

        setPolicies(fullMatrix);
        setSavedPolicies(fullMatrix);
        setHasChanges(false);
      } catch (error) {
        console.error("Failed to load policies:", error);
        toast.error("Failed to load policies");

        const initialPolicies: LeavePolicy[] = [];
        roles.forEach((role) => {
          leaveTypes.forEach((leaveType) => {
            initialPolicies.push({ role: role.key, leaveType: leaveType as LeaveType, daysAllowed: 0 });
          });
        });
        setPolicies(initialPolicies);
        setSavedPolicies(initialPolicies);
      } finally {
        setLoading(false);
      }
    };

    loadPolicies();
    setSelectedRole(null);
  }, [company?.id, rolesLoading, leaveTypesLoading, roles, leaveTypes]);


  const isLeaveTypeApplicable = (leaveType: string, gender: Gender): boolean => {
    const config = LEAVE_TYPE_GENDER_CONFIG.find((c) => c.type === leaveType);
    return config ? config.applicableGenders.includes(gender) : true;
  };

  const isLeaveTypeGenderRestricted = (leaveType: string): boolean => {
    const config = LEAVE_TYPE_GENDER_CONFIG.find((c) => c.type === leaveType);
    return config ? config.isGenderRestricted : false;
  };

  const updatePolicy = (role: string, leaveType: string, days: number) => {
    setPolicies((prev) =>
      prev.map((policy) =>
        policy.role === role && policy.leaveType === leaveType
          ? { ...policy, daysAllowed: Math.max(0, Math.min(365, days)) }
          : policy,
      ),
    );
    setHasChanges(true);
  };

  const incrementPolicy = (role: string, leaveType: string) => {
    const policy = policies.find((p) => p.role === role && p.leaveType === leaveType);
    if (policy) {
      updatePolicy(role, leaveType, policy.daysAllowed + 1);
    }
  };

  const decrementPolicy = (role: string, leaveType: string) => {
    const policy = policies.find((p) => p.role === role && p.leaveType === leaveType);
    if (policy && policy.daysAllowed > 0) {
      updatePolicy(role, leaveType, policy.daysAllowed - 1);
    }
  };

  const toggleWeekends = (role: string, leaveType: string) => {
    setPolicies((prev) =>
      prev.map((p) =>
        p.role === role && p.leaveType === leaveType
          ? { ...p, includeWeekends: !p.includeWeekends }
          : p
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!company?.id) return;

    setLoading(true);

    try {
      const payload = policies.map((p) => ({
        role: p.role,
        leaveType: p.leaveType,
        daysAllowed: p.daysAllowed,
        defaultDays: p.daysAllowed,
        paid: p.leaveType !== "Unpaid Leave",
        genderRestricted: p.leaveType === "Maternity Leave",
        allowedGender: p.leaveType === "Maternity Leave" ? "FEMALE" : null,
        includeWeekends: p.includeWeekends ?? false,
      }));

      await leavePolicyService.savePolicies(company.id, payload);

      setSavedPolicies(policies);
      setHasChanges(false);

      toast.success(`Leave policies saved for ${company.companyName}`);
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save leave policies");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardChanges = () => {
    setPolicies(savedPolicies.map((p) => ({ ...p })));
    setHasChanges(false);
  };

  const getTotalDays = (role: string, gender: Gender) => {
    return policies
      .filter((p) => p.role === role && isLeaveTypeApplicable(p.leaveType, gender))
      .reduce((sum, p) => sum + p.daysAllowed, 0);
  };

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading company information...</p>
        </div>
      </div>
    );
  }

  if (rolesLoading || leaveTypesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading roles and leave types...</p>
        </div>
      </div>
    );
  }

  const visibleRoles = selectedRole ? roles.filter((r) => r.key === selectedRole) : roles;

  return (
    <div className="space-y-5 p-5 bg-slate-50/60 min-h-screen">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Leave Policy Configuration</h1>
              <p className="text-xs text-blue-100 mt-0.5">{company.companyName}</p>
            </div>
          </div>
          {hasChanges && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 px-3 py-1.5 text-xs font-semibold text-amber-100">
              <Zap className="h-3.5 w-3.5" />
              Unsaved Changes
            </span>
          )}
        </div>
      </div>

      {/* ── Controls row: gender + role filter ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">

        {/* Gender */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700">View by Gender</span>
          </div>

          <div className="flex items-center gap-2">
            {(["MALE", "FEMALE", "OTHER"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGender(g)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  selectedGender === g
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {g === "MALE"   && <span>♂</span>}
                {g === "FEMALE" && <span>♀</span>}
                {g === "OTHER"  && <span>⊕</span>}
                {g.charAt(0) + g.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {selectedGender !== "FEMALE" && (
          <div className="flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
            <Lock className="h-3.5 w-3.5 shrink-0 text-orange-500" />
            <p className="text-xs text-orange-700">
              <span className="font-semibold">Maternity Leave</span> is hidden for {selectedGender === "MALE" ? "male" : "other"} employees.
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Role pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 mr-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</span>
          </div>
          <button
            onClick={() => setSelectedRole(null)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              selectedRole === null
                ? "bg-slate-800 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            All Roles
          </button>
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => setSelectedRole(role.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                selectedRole === role.key
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Info tip ── */}
      <div className="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <Info className="h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-xs text-blue-700">
          Set the number of leave days allowed per role. Changes apply across all employees with that role.
        </p>
      </div>

      {/* ── Policy cards per role ── */}
      <div className="space-y-4">
        {visibleRoles.map((role) => {
          const total = getTotalDays(role.key, selectedGender);
          return (
            <div key={role.key} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

              {/* Role header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                    <Users className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{role.label}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{role.key}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Total entitlement</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm font-bold text-emerald-700">
                    {total} <span className="font-normal text-emerald-600">days</span>
                  </span>
                </div>
              </div>

              {/* Leave type tiles */}
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {leaveTypes.map((leaveType) => {
                  if (!isLeaveTypeApplicable(leaveType, selectedGender)) return null;

                  const policy = policies.find((p) => p.role === role.key && p.leaveType === leaveType);
                  const colors = LEAVE_TYPE_COLORS[leaveType] || { bg: "bg-slate-50 border-slate-200", text: "text-slate-700", icon: "text-slate-500" };
                  const isRestricted = isLeaveTypeGenderRestricted(leaveType);
                  const days = policy?.daysAllowed ?? 0;

                  return (
                    <div
                      key={leaveType}
                      className={`relative flex flex-col gap-3 rounded-xl border p-4 transition-all hover:shadow-md ${colors.bg}`}
                    >
                      {/* Type label + lock */}
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-[11px] font-bold uppercase tracking-wide leading-tight ${colors.text}`}>
                          {leaveType}
                        </p>
                        {isRestricted && (
                          <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-white" title="Female only">
                            <Lock className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => decrementPolicy(role.key, leaveType)}
                          disabled={days === 0}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <Input
                          type="number"
                          min="0"
                          max="365"
                          value={days}
                          onChange={(e) => updatePolicy(role.key, leaveType, parseInt(e.target.value) || 0)}
                          className="h-9 flex-1 border-0 bg-white/70 text-center text-xl font-bold shadow-sm ring-1 ring-slate-200 focus-visible:ring-blue-400 rounded-lg p-0"
                        />

                        <button
                          onClick={() => incrementPolicy(role.key, leaveType)}
                          disabled={days >= 365}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <p className="text-center text-[10px] font-medium text-slate-400 tracking-wide uppercase">
                        days / year
                      </p>

                      {/* Include Weekends toggle */}
                      <button
                        type="button"
                        onClick={() => toggleWeekends(role.key, leaveType)}
                        className={`w-full flex items-center justify-between gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                          policy?.includeWeekends
                            ? "border-violet-200 bg-violet-50 text-violet-700"
                            : "border-slate-200 bg-white/60 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <span>Incl. Weekends</span>
                        <span className={`inline-flex h-3.5 w-6 rounded-full relative transition-colors ${policy?.includeWeekends ? "bg-violet-500" : "bg-slate-200"}`}>
                          <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow transition-transform ${policy?.includeWeekends ? "translate-x-2.5" : "translate-x-0.5"}`} />
                        </span>
                      </button>

                      {isRestricted && (
                        <p className="text-center text-[10px] text-pink-500 font-medium">Female only</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Action bar ── */}
      <div className="sticky bottom-0 z-10 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-sm shadow-lg px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {hasChanges ? (
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">You have unsaved changes — click Save to apply.</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400">All changes are saved.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button
                variant="outline"
                onClick={handleDiscardChanges}
                className="h-9 gap-1.5 text-sm"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Discard
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className="h-9 gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {loading ? "Saving…" : "Save Policies"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

