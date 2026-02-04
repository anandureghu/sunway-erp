import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import CountryAutocomplete from "@/modules/hr/components/CountryAutocomplete";
import { Label } from "@/components/ui/label";
import type { ReactElement } from "react";
import type { ImmigrationCtx } from "../ImmigrationShell";
import { toast } from "sonner";
import { immigrationService, type ResidencePermitPayload } from "@/service/immigrationService";
import {
  FileText, Calendar, CheckCircle, AlertTriangle, XCircle, Building,
  Clock, Shield, Info, MapPin, Briefcase, AlertCircle
} from "lucide-react";


interface SelectProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  label: string;
}

type ImmigrationEvent = "immigration:save" | "immigration:cancel" | "immigration:edit";

// Replace/ensure model type + seed use permitIdNumber
type ResidencePermitModel = {
  visaType: string;
  permitIdNumber: string;
  issuePlace: string;
  durationType: string;
  nationality: string;
  issueAuthority: string;
  visaDuration: string;
  occupation: string;
  visaStatus: string;
  startDate: string;
  endDate: string;
};

const SEED: ResidencePermitModel = {
  visaType: "",
  permitIdNumber: "",
  issuePlace: "",
  durationType: "",
  nationality: "",
  issueAuthority: "",
  visaDuration: "",
  occupation: "",
  visaStatus: "",
  startDate: "",
  endDate: "",
};

const VISA_TYPES = ["Work", "Visit", "Student", "Dependent"];
const DURATION_TYPES = ["Single Entry", "Multiple Entry", "Long Term", "Short Term"];
const VISA_STATUS = ["Active", "Expired", "Cancelled", "Pending"];

export default function ResidencePermitForm(): ReactElement {
  const { editing } = useOutletContext<ImmigrationCtx>();
  const { id } = useParams<{ id: string }>();
  const empId = id ? Number(id) : undefined;

  const [saved, setSaved] = useState<ResidencePermitModel>(SEED);
  const [hasPermit, setHasPermit] = useState(false);
  const [draft, setDraft] = useState<ResidencePermitModel>(SEED);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!empId) return;
      try {
        const data = await immigrationService.getResidencePermit(empId);
        if (mounted && data) {
          setHasPermit(true);
          const model: ResidencePermitModel = {
            visaType: data?.visaType ?? "",
            permitIdNumber: data?.permitIdNumber ?? "",
            issuePlace: data?.issuePlace ?? "",
            durationType: data?.durationType ?? "",
            nationality: data?.nationality ?? "",
            issueAuthority: data?.issueAuthority ?? "",
            visaDuration: data?.visaDuration ?? "",
            occupation: data?.occupation ?? "",
            visaStatus: data?.visaStatus ?? "",
            startDate: data?.startDate ?? "",
            endDate: data?.endDate ?? "",
          };
          setSaved(model);
          setDraft(model);
        } else if (mounted) {
          setHasPermit(false);
        }
      } catch (err: any) {
        console.error("ResidencePermitForm -> failed to load:", err?.response?.data ?? err);
      }
    })();
    return () => { mounted = false; };
  }, [empId]);

  /* ================= VALIDITY LOGIC ================= */

  const validity = useMemo(() => {
    if (!draft.endDate || !draft.visaStatus) return null;

    if (draft.visaStatus === "Pending") {
      return { status: "pending", days: 0 };
    }
    if (draft.visaStatus === "Cancelled" || draft.visaStatus === "Expired") {
      return { status: "expired", days: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(draft.endDate);
    const days = Math.floor((end.getTime() - today.getTime()) / 86400000);

    if (days < 0) return { status: "expired", days };
    if (days <= 30) return { status: "expiring", days };
    return { status: "valid", days };
  }, [draft.endDate, draft.visaStatus]);

  const handleEdit = useCallback(() => setDraft(saved), [saved]);
  const handleCancel = useCallback(() => setDraft(saved), [saved]);

  const handleSave = useCallback(async () => {
    if (!empId) return;

    // Validation
    if (!draft.visaType || !draft.permitIdNumber || !draft.issuePlace || !draft.durationType || 
        !draft.nationality || !draft.issueAuthority || !draft.visaDuration || !draft.occupation || 
        !draft.visaStatus || !draft.startDate || !draft.endDate) {
      toast.error("Please fill all required fields");
      return;
    }

    if (draft.endDate <= draft.startDate) {
      toast.error("End date must be after start date");
      return;
    }

    const payload: ResidencePermitPayload = {
      permitIdNumber: draft.permitIdNumber, // ✅ REQUIRED
      visaType: draft.visaType,
      durationType: draft.durationType,
      visaDuration: draft.visaDuration,
      nationality: draft.nationality,
      occupation: draft.occupation,
      issuePlace: draft.issuePlace,
      issueAuthority: draft.issueAuthority,
      visaStatus: draft.visaStatus,
      startDate: draft.startDate || undefined,
      endDate: draft.endDate || undefined,
    } as any;

    try {
      if (hasPermit) {
        await immigrationService.updateResidencePermit(empId, payload);
        toast.success("Residence permit updated");
      } else {
        await immigrationService.createResidencePermit(empId, payload);
        toast.success("Residence permit created");
        setHasPermit(true);
      }
      const fresh = await immigrationService.getResidencePermit(empId);
      if (fresh) {
        const model: ResidencePermitModel = {
          visaType: fresh.visaType ?? "",
          permitIdNumber: fresh.permitIdNumber ?? "",
          issuePlace: fresh.issuePlace ?? "",
          durationType: fresh.durationType ?? "",
          nationality: fresh.nationality ?? "",
          issueAuthority: fresh.issueAuthority ?? "",
          visaDuration: fresh.visaDuration ?? "",
          occupation: fresh.occupation ?? "",
          visaStatus: fresh.visaStatus ?? "",
          startDate: fresh.startDate ?? "",
          endDate: fresh.endDate ?? "",
        };
        setSaved(model);
        setDraft(model);
      }
    } catch (err: any) {
      console.error("ResidencePermitForm -> save failed:", err?.response?.data ?? err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to save permit");
    }
  }, [empId, draft, saved]);

  useEffect(() => {
    const eventHandlers: Record<ImmigrationEvent, () => void> = {
      "immigration:edit": handleEdit,
      "immigration:save": () => { void handleSave(); },
      "immigration:cancel": handleCancel,
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      document.addEventListener(event, handler as EventListener);
    });

    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        document.removeEventListener(event, handler as EventListener);
      });
    };
  }, [handleEdit, handleSave, handleCancel]);

  const patch = useCallback(<K extends keyof ResidencePermitModel>(k: K, v: ResidencePermitModel[K]) =>
    setDraft(d => ({ ...d, [k]: v })), [setDraft]);

  const getValidityConfig = () => {
    if (!validity) return null;

    switch (validity.status) {
      case "valid":
        return {
          bgPattern: "from-emerald-50 via-teal-50 to-cyan-50",
          borderColor: "border-emerald-200",
          textColor: "text-emerald-700",
          icon: CheckCircle,
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
          title: "Visa Active",
          badge: "Valid",
          badgeBg: "bg-emerald-500",
          description: `Your residence permit is valid for ${Math.floor(validity.days / 30)} months (${validity.days} days remaining).`,
        };
      case "expiring":
        return {
          bgPattern: "from-amber-50 via-orange-50 to-red-50",
          borderColor: "border-amber-200",
          textColor: "text-amber-700",
          icon: AlertTriangle,
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
          title: "Expiring Soon",
          badge: "Expiring",
          badgeBg: "bg-amber-500",
          description: `Your residence permit expires in ${validity.days} days. Start renewal process to avoid interruption.`,
        };
      case "expired":
        return {
          bgPattern: "from-red-50 via-rose-50 to-pink-50",
          borderColor: "border-red-200",
          textColor: "text-red-700",
          icon: XCircle,
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          title: draft.visaStatus === "Cancelled" ? "Visa Cancelled" : "Visa Expired",
          badge: draft.visaStatus === "Cancelled" ? "Cancelled" : "Expired",
          badgeBg: "bg-red-500",
          description: draft.visaStatus === "Cancelled"
            ? "This residence permit has been cancelled."
            : "This residence permit has expired. Immediate renewal required.",
        };
      case "pending":
        return {
          bgPattern: "from-blue-50 via-indigo-50 to-purple-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-700",
          icon: Clock,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          title: "Pending Status",
          badge: "Pending",
          badgeBg: "bg-blue-500",
          description: "Your residence permit status is pending and awaiting official confirmation.",
        };
      default:
        return null;
    }
  };

  const validityConfig = getValidityConfig();
  const ValidityIcon = validityConfig?.icon;

  const calculateValidity = () => {
    if (!draft.startDate || !draft.endDate) return null;
    const start = new Date(draft.startDate);
    const end = new Date(draft.endDate);
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    return { years, months, totalDays };
  };

  const validityPeriod = calculateValidity();

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>

          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl p-4">
                    <FileText className="h-10 w-10 text-white" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="text-white">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">Residence Permit & Visa</h1>
                  <p className="text-blue-100 text-sm md:text-base">Manage immigration documentation and residence status</p>
                </div>
              </div>

              {validityConfig && ValidityIcon && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${validityConfig.badgeBg} text-white shadow-lg`}>
                  <ValidityIcon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{validityConfig.badge}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Validity Alert Banner */}
        {validityConfig && ValidityIcon && (
          <div className={`relative overflow-hidden bg-gradient-to-r ${validityConfig.bgPattern} border-2 ${validityConfig.borderColor} rounded-xl shadow-lg`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative p-6">
              <div className="flex items-start gap-4">
                <div className={`${validityConfig.iconBg} rounded-xl p-3 shadow-sm`}>
                  <ValidityIcon className={`h-6 w-6 ${validityConfig.iconColor}`} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{validityConfig.title}</h3>
                  <p className={`text-sm ${validityConfig.textColor} mb-3`}>{validityConfig.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {draft.startDate && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-lg text-xs font-medium text-slate-700">
                        <Calendar className="h-3.5 w-3.5" />
                        From: {new Date(draft.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                    {draft.endDate && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-lg text-xs font-medium text-slate-700">
                        <Calendar className="h-3.5 w-3.5" />
                        To: {new Date(draft.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                    {validity && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-lg text-xs font-medium text-slate-700">
                        <Clock className="h-3.5 w-3.5" />
                        {validity.days > 0 ? `${validity.days} days remaining` : `${Math.abs(validity.days)} days overdue`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visa Details Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 rounded-lg p-2">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Visa Details</h2>
                    <p className="text-xs text-slate-600">Type, duration, and personal information</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField label="Visa Type" required icon={<FileText className="h-4 w-4" />} hint="Select visa category">
                    <Select
                      disabled={!editing}
                      value={draft.visaType}
                      onChange={(v) => patch("visaType", v)}
                      options={VISA_TYPES}
                      label="Visa type"
                    />
                  </FormField>

                  <FormField label="Permit ID Number" required icon={<Shield className="h-4 w-4" />} hint="Unique identification">
                    <Input
                      type="text"
                      disabled={!editing}
                      value={draft.permitIdNumber}
                      onChange={(e) => patch("permitIdNumber", e.target.value.toUpperCase())}
                      placeholder="PERMIT-2024-00123"
                      className="font-mono text-lg font-semibold tracking-wider disabled:bg-slate-50 disabled:text-slate-900 h-12"
                    />
                  </FormField>

                  <FormField label="Duration Type" required icon={<Clock className="h-4 w-4" />} hint="Entry type classification">
                    <Select
                      disabled={!editing}
                      value={draft.durationType}
                      onChange={(v) => patch("durationType", v)}
                      options={DURATION_TYPES}
                      label="Duration type"
                    />
                  </FormField>

                  <FormField label="Nationality" required icon={<MapPin className="h-4 w-4" />} hint="Citizenship country">
                    <CountryAutocomplete
                      value={draft.nationality}
                      onChange={(v) => patch("nationality", v)}
                      disabled={!editing}
                      placeholder="Select country..."
                    />
                  </FormField>

                  <FormField label="Visa Duration" required icon={<Calendar className="h-4 w-4" />} hint="Duration period (e.g., 1 year)">
                    <Input
                      type="text"
                      disabled={!editing}
                      value={draft.visaDuration}
                      onChange={(e) => patch("visaDuration", e.target.value)}
                      placeholder="1 year"
                      className="disabled:bg-slate-50 disabled:text-slate-900 h-12"
                    />
                  </FormField>

                  <FormField label="Occupation" required icon={<Briefcase className="h-4 w-4" />} hint="Professional designation">
                    <Input
                      type="text"
                      disabled={!editing}
                      value={draft.occupation}
                      onChange={(e) => patch("occupation", e.target.value)}
                      placeholder="Software Engineer"
                      className="disabled:bg-slate-50 disabled:text-slate-900 h-12"
                    />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Issuing Authority Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 rounded-lg p-2">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Issuing Authority</h2>
                    <p className="text-xs text-emerald-700">Government department and location details</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField label="Issue Place" required icon={<MapPin className="h-4 w-4" />} hint="City or location">
                    <Input
                      type="text"
                      disabled={!editing}
                      value={draft.issuePlace}
                      onChange={(e) => patch("issuePlace", e.target.value)}
                      placeholder="New York"
                      className="disabled:bg-slate-50 disabled:text-slate-900 h-12"
                    />
                  </FormField>

                  <FormField label="Issuing Authority" required icon={<Building className="h-4 w-4" />} hint="Government agency">
                    <Input
                      type="text"
                      disabled={!editing}
                      value={draft.issueAuthority}
                      onChange={(e) => patch("issueAuthority", e.target.value)}
                      placeholder="Immigration Department"
                      className="disabled:bg-slate-50 disabled:text-slate-900 h-12"
                    />
                  </FormField>

                  <FormField label="Visa Status" required icon={<AlertCircle className="h-4 w-4" />} hint="Current status">
                    <Select
                      disabled={!editing}
                      value={draft.visaStatus}
                      onChange={(v) => patch("visaStatus", v)}
                      options={VISA_STATUS}
                      label="Visa status"
                    />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Validity Period Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500 rounded-lg p-2">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Validity Period</h2>
                    <p className="text-xs text-indigo-700">Permit start and end dates</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField label="Start Date" required icon={<Calendar className="h-4 w-4" />}>
                    <Input
                      type="date"
                      disabled={!editing}
                      value={draft.startDate}
                      onChange={(e) => patch("startDate", e.target.value)}
                      className="disabled:bg-slate-50 disabled:text-slate-900 h-12"
                    />
                  </FormField>

                  <FormField label="End Date" required icon={<Calendar className="h-4 w-4" />}>
                    <Input
                      type="date"
                      disabled={!editing}
                      value={draft.endDate}
                      onChange={(e) => patch("endDate", e.target.value)}
                      className="disabled:bg-slate-50 disabled:text-slate-900 h-12"
                    />
                  </FormField>
                </div>

                {validityPeriod && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-100">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-500 rounded-lg p-2.5">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-2">Total Validity Period</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{validityPeriod.years}</div>
                            <div className="text-xs text-slate-600 uppercase tracking-wide">Years</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{validityPeriod.months}</div>
                            <div className="text-xs text-slate-600 uppercase tracking-wide">Months</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{validityPeriod.totalDays}</div>
                            <div className="text-xs text-slate-600 uppercase tracking-wide">Days</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compliance Advisory */}
                <div className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-4">
                  <div className="bg-amber-500 rounded-lg p-2 flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 mb-1">Compliance Notice</h4>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Ensure all documentation is current and valid. Start renewal procedures at least 30 days before expiration. Non-compliance may result in employment status changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Info */}
          <div className="space-y-6">
            {/* Quick Summary Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                  <div className="bg-white/10 rounded-lg p-2">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-lg">Permit Summary</h3>
                </div>

                <div className="space-y-4">
                  <SummaryItem 
                    label="Permit ID" 
                    value={draft.permitIdNumber || "Not provided"} 
                    mono 
                  />
                  <SummaryItem 
                    label="Visa Type" 
                    value={draft.visaType || "Not provided"} 
                  />
                  <SummaryItem 
                    label="Nationality" 
                    value={draft.nationality || "Not provided"} 
                  />
                  <SummaryItem 
                    label="Occupation" 
                    value={draft.occupation || "Not provided"} 
                  />
                  <SummaryItem 
                    label="Duration" 
                    value={draft.visaDuration || "Not provided"} 
                  />
                  <SummaryItem 
                    label="Issued By" 
                    value={draft.issueAuthority || "Not provided"} 
                  />
                  
                  {draft.startDate && (
                    <SummaryItem 
                      label="Valid From" 
                      value={new Date(draft.startDate).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })} 
                    />
                  )}
                  
                  {draft.endDate && (
                    <SummaryItem 
                      label="Valid Until" 
                      value={new Date(draft.endDate).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })} 
                      highlight={validity?.status === "expiring" || validity?.status === "expired"}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
                <div className="flex items-center gap-2 text-white">
                  <Info className="h-5 w-5" />
                  <h3 className="font-bold">Important Information</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <InfoItem 
                  icon={<Shield className="h-4 w-4" />}
                  text="Always keep original and copy of residence permit accessible"
                />
                <InfoItem 
                  icon={<Calendar className="h-4 w-4" />}
                  text="Begin renewal process 60 days before expiration date"
                />
                <InfoItem 
                  icon={<AlertTriangle className="h-4 w-4" />}
                  text="Report status changes immediately to HR and immigration authorities"
                />
                <InfoItem 
                  icon={<FileText className="h-4 w-4" />}
                  text="Maintain updated documentation with local immigration office"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= HELPER COMPONENTS ================= */

function FormField({
  label,
  children,
  required,
  icon,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  icon?: React.ReactElement;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function SummaryItem({ 
  label, 
  value, 
  mono = false, 
  highlight = false 
}: { 
  label: string; 
  value: string; 
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</div>
      <div className={`text-sm font-semibold ${mono ? 'font-mono tracking-wider' : ''} ${highlight ? 'text-amber-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

function InfoItem({ icon, text }: { icon: React.ReactElement<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-blue-100 rounded-lg p-2 mt-0.5 flex-shrink-0">
        {React.cloneElement(icon, { className: "h-4 w-4 text-blue-600" })}
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
    </div>
  );
}

function Select({ value, options, onChange, disabled, label }: SelectProps): ReactElement {
  const selectId = `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <select
      id={selectId}
      className="h-12 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-50 disabled:text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={label}
      aria-required="true"
    >
      <option value="" hidden>
        Select…
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}