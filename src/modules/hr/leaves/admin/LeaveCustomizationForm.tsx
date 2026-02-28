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
  Building2,
} from "lucide-react";
import { type LeavePolicy, type Role, type LeaveType, ROLES } from "@/types/hr";
import { getAllCompanies } from "@/service/companyService";
import { leavePolicyService } from "@/service/leavePolicyService";

const ALL_LEAVE_TYPES: LeaveType[] = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Unpaid Leave",
  "Maternity Leave",
];

const LEAVE_TYPE_COLORS: Record<
  LeaveType,
  { bg: string; text: string; icon: string }
> = {
  "Annual Leave": {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    icon: "text-blue-500",
  },
  "Sick Leave": {
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    icon: "text-red-500",
  },
  "Emergency Leave": {
    bg: "bg-orange-50 border-orange-200",
    text: "text-orange-700",
    icon: "text-orange-500",
  },
  "Unpaid Leave": {
    bg: "bg-gray-50 border-gray-200",
    text: "text-gray-700",
    icon: "text-gray-500",
  },
  "Maternity Leave": {
    bg: "bg-pink-50 border-pink-200",
    text: "text-pink-700",
    icon: "text-pink-500",
  },
};

const ROLE_COLORS: Record<Role, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-purple-100 text-purple-700", text: "text-purple-700" },
  SUPER_ADMIN: { bg: "bg-indigo-100 text-indigo-700", text: "text-indigo-700" },
  USER: { bg: "bg-blue-100 text-blue-700", text: "text-blue-700" },
  FINANCE_MANAGER: {
    bg: "bg-green-100 text-green-700",
    text: "text-green-700",
  },
  ACCOUNTANT: {
    bg: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
  },
  CASHIER: {
    bg: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
  },
  AP_AR_CLERK: { bg: "bg-teal-100 text-teal-700", text: "text-teal-700" },
  CONTROLLER: { bg: "bg-cyan-100 text-cyan-700", text: "text-cyan-700" },
  AUDITOR_EXTERNAL: {
    bg: "bg-slate-100 text-slate-700",
    text: "text-slate-700",
  },
  HR: {
    bg: "",
    text: "",
  },
};

type Gender = "MALE" | "FEMALE" | "OTHER";

interface LeaveTypeConfig {
  type: LeaveType;
  applicableGenders: Gender[];
  isGenderRestricted: boolean;
}

interface Company {
  id: number;
  name: string;
  code: string;
}

// interface CompanyLeavePolicies {
//   companyId: number;
//   policies: LeavePolicy[];
//   lastUpdated: string;
// }

const LEAVE_TYPE_GENDER_CONFIG: LeaveTypeConfig[] = [
  {
    type: "Annual Leave",
    applicableGenders: ["MALE", "FEMALE", "OTHER"],
    isGenderRestricted: false,
  },
  {
    type: "Sick Leave",
    applicableGenders: ["MALE", "FEMALE", "OTHER"],
    isGenderRestricted: false,
  },
  {
    type: "Emergency Leave",
    applicableGenders: ["MALE", "FEMALE", "OTHER"],
    isGenderRestricted: false,
  },
  {
    type: "Unpaid Leave",
    applicableGenders: ["MALE", "FEMALE", "OTHER"],
    isGenderRestricted: false,
  },
  {
    type: "Maternity Leave",
    applicableGenders: ["FEMALE"],
    isGenderRestricted: true,
  },
];

// Company data will be loaded from API

export default function LeaveCustomizationForm() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  // const [] = useState<Map<number, CompanyLeavePolicies>>(new Map());

  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedPolicies, setSavedPolicies] = useState<LeavePolicy[]>([]);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedGender, setSelectedGender] = useState<Gender>("FEMALE");
  const [showGenderInfo, setShowGenderInfo] = useState(false);

  // Load companies from API
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await getAllCompanies();
        if (data) {
          // Map API response to local Company interface
          const mappedCompanies: Company[] = data.map((company: any) => ({
            id: company.id,
            name: company.companyName,
            code: company.crNo,
          }));
          setCompanies(mappedCompanies);
        }
      } catch (error) {
        console.error("Failed to load companies:", error);
        toast.error("Failed to load companies");
      }
    };

    loadCompanies();
  }, []);

  // Initialize companies and load their policies
  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0]);
    }
  }, [companies]);

  // Load policies when company changes
  useEffect(() => {
    if (!selectedCompany) return;

    const loadPolicies = async () => {
      try {
        const response = await leavePolicyService.getPolicies(
          selectedCompany.id,
        );
        const saved = response.data || [];

        // Build full matrix
        const fullMatrix: LeavePolicy[] = [];

        ROLES.forEach((role) => {
          ALL_LEAVE_TYPES.forEach((leaveType) => {
            const existing = saved.find(
              (p: any) => p.role === role && p.leaveType === leaveType,
            );

            fullMatrix.push({
              role: role.key,
              leaveType,
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

        // Fallback to initial policies on error
        const initialPolicies: LeavePolicy[] = [];
        ROLES.forEach((role) => {
          ALL_LEAVE_TYPES.forEach((leaveType) => {
            initialPolicies.push({ role: role.key, leaveType, daysAllowed: 0 });
          });
        });
        setPolicies(initialPolicies);
        setSavedPolicies(initialPolicies);
      }
    };

    loadPolicies();
    setSelectedRole(null);
  }, [selectedCompany]);

  const handleCompanyChange = (company: Company) => {
    if (hasChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Do you want to discard them and switch companies?",
      );
      if (!confirmed) return;
    }
    setSelectedCompany(company);
  };

  const getApplicableLeaveTypes = (gender: Gender): LeaveType[] => {
    return LEAVE_TYPE_GENDER_CONFIG.filter((config) =>
      config.applicableGenders.includes(gender),
    ).map((config) => config.type);
  };

  const isLeaveTypeApplicable = (
    leaveType: LeaveType,
    gender: Gender,
  ): boolean => {
    const config = LEAVE_TYPE_GENDER_CONFIG.find((c) => c.type === leaveType);
    return config ? config.applicableGenders.includes(gender) : true;
  };

  const isLeaveTypeGenderRestricted = (leaveType: LeaveType): boolean => {
    const config = LEAVE_TYPE_GENDER_CONFIG.find((c) => c.type === leaveType);
    return config ? config.isGenderRestricted : false;
  };

  const updatePolicy = (role: Role, leaveType: LeaveType, days: number) => {
    setPolicies((prev) =>
      prev.map((policy) =>
        policy.role === role && policy.leaveType === leaveType
          ? { ...policy, daysAllowed: Math.max(0, Math.min(365, days)) }
          : policy,
      ),
    );
    setHasChanges(true);
  };

  const incrementPolicy = (role: Role, leaveType: LeaveType) => {
    const policy = policies.find(
      (p) => p.role === role && p.leaveType === leaveType,
    );
    if (policy) {
      updatePolicy(role, leaveType, policy.daysAllowed + 1);
    }
  };

  const decrementPolicy = (role: Role, leaveType: LeaveType) => {
    const policy = policies.find(
      (p) => p.role === role && p.leaveType === leaveType,
    );
    if (policy && policy.daysAllowed > 0) {
      updatePolicy(role, leaveType, policy.daysAllowed - 1);
    }
  };

  const handleSave = async () => {
    if (!selectedCompany) return;

    setLoading(true);

    try {
      const payload = policies.map((p) => ({
        role: p.role,
        leaveType: p.leaveType,
        daysAllowed: p.daysAllowed,
        defaultDays: p.daysAllowed, // IMPORTANT
        paid: p.leaveType !== "Unpaid Leave", // business rule
        genderRestricted: p.leaveType === "Maternity Leave",
        allowedGender: p.leaveType === "Maternity Leave" ? "FEMALE" : null,
      }));

      await leavePolicyService.savePolicies(selectedCompany.id, payload);

      setSavedPolicies(policies);
      setHasChanges(false);

      toast.success(`Leave policies saved for ${selectedCompany.name}`);
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

  const getTotalDays = (role: Role, gender: Gender) => {
    return policies
      .filter(
        (p) => p.role === role && isLeaveTypeApplicable(p.leaveType, gender),
      )
      .reduce((sum, p) => sum + p.daysAllowed, 0);
  };

  const getRoleDisplayName = (role: Role) => {
    const names: Record<Role, string> = {
      ADMIN: "Admin",
      SUPER_ADMIN: "Super Admin",
      USER: "User",
      FINANCE_MANAGER: "Finance Manager",
      ACCOUNTANT: "Accountant",
      AP_AR_CLERK: "AP/AR Clerk",
      CONTROLLER: "Controller",
      AUDITOR_EXTERNAL: "External Auditor",
      HR: "",
    };
    return names[role];
  };

  const applicableLeaveTypes = getApplicableLeaveTypes(selectedGender);

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
                    <Calendar
                      className="h-10 w-10 text-white"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
                <div className="text-white">
                  <h1 className="text-3xl font-bold mb-2 tracking-tight">
                    Leave Policy Configuration
                  </h1>
                  <p className="text-blue-100 text-sm">
                    Configure company-specific leave policies for all employee
                    roles
                  </p>
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

        {/* Company Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-5 w-5 text-slate-600" />
              <h2 className="font-bold text-slate-900">Select Company</h2>
            </div>
            <p className="text-sm text-slate-600">
              Choose a company to configure its leave policies. Each company can
              have different leave policies.
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleCompanyChange(company)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedCompany?.id === company.id
                      ? "border-indigo-600 bg-indigo-50 shadow-lg"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className={`font-bold ${selectedCompany?.id === company.id ? "text-indigo-900" : "text-slate-900"}`}
                      >
                        {company.name}
                      </h3>
                      <p
                        className={`text-xs mt-1 ${selectedCompany?.id === company.id ? "text-indigo-700" : "text-slate-500"}`}
                      >
                        Code: {company.code}
                      </p>
                    </div>
                    {selectedCompany?.id === company.id && (
                      <CheckCircle2 className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedCompany && (
          <>
            {/* Instructions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 flex items-start gap-4">
              <div className="bg-blue-100 rounded-full p-3 flex-shrink-0">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Configuring policies for {selectedCompany.name}
                </h3>
                <p className="text-sm text-slate-600">
                  Set the number of days allowed for each leave type per
                  employee role. Some leave types are gender-specific and will
                  only show for applicable employees. Changes will be saved for
                  this company only.
                </p>
              </div>
            </div>

            {/* Gender Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">
                    Gender-Specific Leave Configuration
                  </h3>
                  <p className="text-sm text-slate-600">
                    Select a gender to view applicable leave types for{" "}
                    {selectedCompany.name}.
                  </p>
                </div>
                <button
                  onClick={() => setShowGenderInfo(!showGenderInfo)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {showGenderInfo ? "Hide Info" : "Show Info"}
                </button>
              </div>

              {showGenderInfo && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Maternity Leave is a protected
                    benefit available only to female employees. This ensures
                    compliance with labor laws and supports gender-appropriate
                    benefits.
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
                    <strong>Maternity Leave is hidden</strong> for{" "}
                    {selectedGender === "MALE" ? "male" : "other"} employees.
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
              {ROLES.map((role) => (
                <button
                  key={role.key}
                  onClick={() => setSelectedRole(role.key)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedRole === role.key
                      ? `${ROLE_COLORS[role.key].bg}`
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {getRoleDisplayName(role.key)}
                </button>
              ))}
            </div>

            {/* Policies Grid */}
            <div className="space-y-6">
              {(selectedRole ? [selectedRole] : ROLES).map((role) => (
                <div
                  key={typeof role === "string" ? role : role.key}
                  className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
                >
                  {/* Role Header */}
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-slate-600" />
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {getRoleDisplayName(
                            typeof role === "string" ? role : role.key,
                          )}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {typeof role === "string" ? role : role.key}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-600">
                        Total Days:
                      </span>
                      <span className="text-2xl font-bold text-emerald-600">
                        {getTotalDays(
                          typeof role === "string" ? role : role.key,
                          selectedGender,
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Leave Types Grid */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {applicableLeaveTypes.map((leaveType) => {
                      const policy = policies.find(
                        (p) => p.role === role && p.leaveType === leaveType,
                      );
                      const colors = LEAVE_TYPE_COLORS[leaveType];
                      const isRestricted =
                        isLeaveTypeGenderRestricted(leaveType);

                      return (
                        <div
                          key={leaveType}
                          className={`${colors.bg} border rounded-xl p-4 transition-all hover:shadow-md relative`}
                        >
                          {isRestricted && (
                            <div
                              className="absolute top-2 right-2 bg-pink-500 text-white rounded-full p-1.5"
                              title="Gender-restricted leave type"
                            >
                              <Lock className="h-3 w-3" />
                            </div>
                          )}

                          <div className="space-y-3">
                            <div className="pr-6">
                              <p
                                className={`text-xs font-bold uppercase tracking-wide ${colors.text}`}
                              >
                                {leaveType}
                              </p>
                              {isRestricted && (
                                <p className="text-xs text-pink-600 mt-1">
                                  Female employees only
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <button
                                onClick={() =>
                                  decrementPolicy(
                                    typeof role === "string" ? role : role.key,
                                    leaveType,
                                  )
                                }
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
                                onChange={(e) =>
                                  updatePolicy(
                                    typeof role === "string" ? role : role.key,
                                    leaveType,
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                className="flex-1 text-center text-3xl font-bold border-2 border-slate-300 focus:border-blue-500 py-3"
                                placeholder="0"
                              />

                              <button
                                onClick={() =>
                                  incrementPolicy(
                                    typeof role === "string" ? role : role.key,
                                    leaveType,
                                  )
                                }
                                disabled={!policy || policy.daysAllowed >= 365}
                                className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                <Plus className="h-4 w-4 text-slate-600" />
                              </button>
                            </div>

                            <p className="text-xs text-slate-500 text-center">
                              days
                            </p>
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
                        You have unsaved changes for {selectedCompany.name}.
                        Click Save to apply.
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {hasChanges && (
                    <Button
                      variant="outline"
                      onClick={handleDiscardChanges}
                      className="flex items-center gap-2"
                    >
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
                    {loading ? "Saving..." : `Save for ${selectedCompany.name}`}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
