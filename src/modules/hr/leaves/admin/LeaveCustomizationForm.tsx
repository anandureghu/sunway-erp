import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  RefreshCw,
  Info,
  Plus,
  Minus,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  Zap,
  Lock,
  Loader2,
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
  const [showGenderInfo, setShowGenderInfo] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        if (company?.id) {
          const response = await roleService.getRoles(company.id);
          if (response && response.length > 0) {
            setRoles(convertRolesFromApi(response));
          }
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, [company?.id]);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        if (company?.id) {
          const response = await leavePolicyService.getLeaveTypes(company.id);
          if (response.data && response.data.length > 0) {
            setLeaveTypes(response.data.map((lt: { name: string }) => lt.name));
          }
        }
      } catch (error) {
        console.error("Failed to fetch leave types:", error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>

          <div className="relative p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl p-4">
                    <Calendar className="h-10 w-10 text-white" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="text-white">
                  <h1 className="text-3xl font-bold mb-2 tracking-tight">Leave Policy Configuration</h1>
                  <p className="text-blue-100 text-sm">Configuring leave policies for {company.companyName}</p>
                </div>
              </div>

              {hasChanges && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 border border-amber-300 shadow-lg">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-semibold">Unsaved Changes</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 flex items-start gap-4">
          <div className="bg-blue-100 rounded-full p-3 flex-shrink-0">
            <Info className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">Configuring policies for {company.companyName}</h3>
            <p className="text-sm text-slate-600">
              Set the number of days allowed for each leave type per employee role.
            </p>
          </div>
        </div>

        {/* Gender Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Gender-Specific Leave Configuration</h3>
              <p className="text-sm text-slate-600">Select a gender to view applicable leave types.</p>
            </div>
            <button onClick={() => setShowGenderInfo(!showGenderInfo)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              {showGenderInfo ? "Hide Info" : "Show Info"}
            </button>
          </div>

          {showGenderInfo && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Maternity Leave is available only to female employees.
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            {(["MALE", "FEMALE", "OTHER"] as Gender[]).map((gender) => (
              <button
                key={gender}
                onClick={() => setSelectedGender(gender)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedGender === gender
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {gender === "MALE" && "👨 Male"}
                {gender === "FEMALE" && "👩 Female"}
                {gender === "OTHER" && "🧑 Other"}
              </button>
            ))}
          </div>

          {selectedGender !== "FEMALE" && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <Lock className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700">
                <strong>Maternity Leave is hidden</strong> for {selectedGender === "MALE" ? "male" : "other"} employees.
              </p>
            </div>
          )}
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedRole(null)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
              selectedRole === null
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Roles
          </button>
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => setSelectedRole(role.key)}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedRole === role.key
                  ? (role.color?.bg || "bg-blue-100 text-blue-700")
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>

        {/* Policies Grid */}
        <div className="space-y-6">
          {(selectedRole ? roles.filter((r) => r.key === selectedRole) : roles).map((role) => (
            <div key={role.key} className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-slate-600" />
                  <div>
                    <h3 className="font-bold text-slate-900">{role.label}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{role.key}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-600">Total Days:</span>
                  <span className="text-2xl font-bold text-emerald-600">{getTotalDays(role.key, selectedGender)}</span>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {leaveTypes.map((leaveType) => {
                  if (!isLeaveTypeApplicable(leaveType, selectedGender)) {
                    return null;
                  }
                  
                  const policy = policies.find((p) => p.role === role.key && p.leaveType === leaveType);
                  const colors = LEAVE_TYPE_COLORS[leaveType] || { bg: "bg-slate-50 border-slate-200", text: "text-slate-700", icon: "text-slate-500" };
                  const isRestricted = isLeaveTypeGenderRestricted(leaveType);

                  return (
                    <div key={leaveType} className={`${colors.bg} border rounded-xl p-4 transition-all hover:shadow-md relative`}>
                      {isRestricted && (
                        <div className="absolute top-2 right-2 bg-pink-500 text-white rounded-full p-1.5" title="Gender-restricted leave type">
                          <Lock className="h-3 w-3" />
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="pr-6">
                          <p className={`text-xs font-bold uppercase tracking-wide ${colors.text}`}>{leaveType}</p>
                          {isRestricted && <p className="text-xs text-pink-600 mt-1">Female employees only</p>}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => decrementPolicy(role.key, leaveType)}
                            disabled={!policy || policy.daysAllowed === 0}
                            className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <Minus className="h-4 w-4 text-slate-600" />
                          </button>

                          <Input
                            type="number"
                            min="0"
                            max="365"
                            value={policy?.daysAllowed || 0}
                            onChange={(e) => updatePolicy(role.key, leaveType, parseInt(e.target.value) || 0)}
                            className="flex-1 text-center text-3xl font-bold border-2 border-slate-300 focus:border-blue-500 py-3"
                            placeholder="0"
                          />

                          <button
                            onClick={() => incrementPolicy(role.key, leaveType)}
                            disabled={!policy || policy.daysAllowed >= 365}
                            className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <Plus className="h-4 w-4 text-slate-600" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-500 text-center">days</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {hasChanges && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    You have unsaved changes for {company.companyName}. Click Save to apply.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <Button variant="outline" onClick={handleDiscardChanges} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Discard
                </Button>
              )}

              <Button
                onClick={handleSave}
                disabled={loading || !hasChanges}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg"
              >
                <CheckCircle2 className="h-4 w-4" />
                {loading ? "Saving..." : `Save for ${company.companyName}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

