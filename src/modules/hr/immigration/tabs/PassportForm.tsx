import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import CountryAutocomplete from "@/modules/hr/components/CountryAutocomplete";
import { Label } from "@/components/ui/label";
import type { ReactElement } from "react";
import type { ImmigrationCtx } from "../ImmigrationShell";
import { toast } from "sonner";
import { immigrationService, type PassportPayload } from "@/service/immigrationService";
import { Globe, Calendar, CheckCircle, AlertTriangle, XCircle, FileText, User, MapPin, Clock, Shield, Info } from "lucide-react";

/* ================= TYPES ================= */

type ImmigrationEvent =
  | "immigration:save"
  | "immigration:cancel"
  | "immigration:edit";

type PassportModel = {
  passportNo: string;
  issueCountry: string;
  nameAsPassport: string;
  nationality: string;
  issueDate: string;
  expireDate: string;
};

const EMPTY: PassportModel = {
  passportNo: "",
  issueCountry: "",
  nameAsPassport: "",
  nationality: "",
  issueDate: "",
  expireDate: "",
};



/* ================= COMPONENT ================= */

export default function PassportForm(): ReactElement {
  const { editing } = useOutletContext<ImmigrationCtx>();
  const { id } = useParams<{ id: string }>();
  const empId = id ? Number(id) : undefined;

  const [saved, setSaved] = useState<PassportModel>(EMPTY);
  const [draft, setDraft] = useState<PassportModel>(EMPTY);

  /* ================= LOAD ================= */

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!empId) return;
      try {
        const data = await immigrationService.getPassport(empId);
        if (!mounted || !data) return;

        const model: PassportModel = {
          passportNo: data.passportNo ?? "",
          issueCountry: data.issueCountry ?? "",
          nameAsPassport: data.nameAsPassport ?? "",
          nationality: data.nationality ?? "",
          issueDate: data.issueDate ?? "",
          expireDate: (data.expiryDate ?? data.expireDate) ?? "",
        };

        setSaved(model);
        setDraft(model);
      } catch (err: any) {
        console.error("PassportForm load failed:", err);
      }
    })();
    return () => { mounted = false; };
  }, [empId]);

  /* ================= VALIDITY LOGIC ================= */

  const validity = useMemo(() => {
    if (!draft.expireDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exp = new Date(draft.expireDate);
    const days = Math.floor((exp.getTime() - today.getTime()) / 86400000);

    if (days < 0) return { status: "expired", days };
    if (days <= 180) return { status: "expiring", days };
    return { status: "valid", days };
  }, [draft.expireDate]);

  /* ================= ACTIONS ================= */

  const patch = useCallback(
    <K extends keyof PassportModel>(k: K, v: PassportModel[K]) =>
      setDraft((d) => ({ ...d, [k]: v })),
    []
  );

  const handleEdit = useCallback(() => setDraft(saved), [saved]);
  const handleCancel = useCallback(() => setDraft(saved), [saved]);

  const handleSave = useCallback(async () => {
    if (!empId) return;

    if (!draft.passportNo || !draft.issueCountry || !draft.nameAsPassport) {
      toast.error("Please fill all required fields");
      return;
    }

    if (draft.issueDate && draft.expireDate) {
      if (draft.expireDate <= draft.issueDate) {
        toast.error("Expire date must be after issue date");
        return;
      }
    }

    const payload: PassportPayload = {
      passportNo: draft.passportNo,
      nameAsPassport: draft.nameAsPassport,
      issueCountry: draft.issueCountry,
      nationality: draft.nationality,
      issueDate: draft.issueDate,
      expiryDate: draft.expireDate,
    };

    try {
      if (saved.passportNo) {
        await immigrationService.updatePassport(empId, payload);
        toast.success("Passport updated");
      } else {
        await immigrationService.createPassport(empId, payload);
        toast.success("Passport created");
      }

      const fresh = await immigrationService.getPassport(empId);
      if (fresh) {
        const model: PassportModel = {
          passportNo: fresh.passportNo ?? "",
          issueCountry: fresh.issueCountry ?? "",
          nameAsPassport: fresh.nameAsPassport ?? "",
          nationality: fresh.nationality ?? "",
          issueDate: fresh.issueDate ?? "",
          expireDate: (fresh.expiryDate ?? fresh.expireDate) ?? "",
        };
        setSaved(model);
        setDraft(model);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save passport");
    }
  }, [empId, draft, saved]);

  /* ================= EVENTS ================= */

  useEffect(() => {
    const handlers: Record<ImmigrationEvent, () => void> = {
      "immigration:edit": handleEdit,
      "immigration:save": handleSave,
      "immigration:cancel": handleCancel,
    };

    Object.entries(handlers).forEach(([e, h]) =>
      document.addEventListener(e, h as EventListener)
    );

    return () => {
      Object.entries(handlers).forEach(([e, h]) =>
        document.removeEventListener(e, h as EventListener)
      );
    };
  }, [handleEdit, handleSave, handleCancel]);

  /* ================= RENDER HELPERS ================= */

  const getValidityConfig = () => {
    if (!validity) return null;

    switch (validity.status) {
      case "valid":
        return {
          gradient: "from-emerald-500 via-teal-500 to-cyan-500",
          bgPattern: "from-emerald-50 via-teal-50 to-cyan-50",
          borderColor: "border-emerald-200",
          textColor: "text-emerald-700",
          icon: CheckCircle,
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
          title: "Passport Valid",
          badge: "Valid",
          badgeBg: "bg-emerald-500",
        };
      case "expiring":
        return {
          gradient: "from-amber-500 via-orange-500 to-red-400",
          bgPattern: "from-amber-50 via-orange-50 to-red-50",
          borderColor: "border-amber-200",
          textColor: "text-amber-700",
          icon: AlertTriangle,
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
          title: "Expiring Soon",
          badge: "Expiring",
          badgeBg: "bg-amber-500",
        };
      case "expired":
        return {
          gradient: "from-red-500 via-rose-500 to-pink-500",
          bgPattern: "from-red-50 via-rose-50 to-pink-50",
          borderColor: "border-red-200",
          textColor: "text-red-700",
          icon: XCircle,
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          title: "Passport Expired",
          badge: "Expired",
          badgeBg: "bg-red-500",
        };
      default:
        return null;
    }
  };

  const validityConfig = getValidityConfig();
  const ValidityIcon = validityConfig?.icon;

  const calculateValidity = () => {
    if (!draft.issueDate || !draft.expireDate) return null;
    const issue = new Date(draft.issueDate);
    const expire = new Date(draft.expireDate);
    const totalDays = Math.floor((expire.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    return { years, months, totalDays };
  };

  const validityPeriod = calculateValidity();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Premium Header with Passport Visual */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>

          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl p-4">
                    <Globe className="h-10 w-10 text-white" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="text-white">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">Passport Information</h1>
                  <p className="text-blue-100 text-sm md:text-base">Manage international travel documentation and validity status</p>
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
                  <p className={`text-sm ${validityConfig.textColor} mb-3`}>
                    {validity?.status === "valid" && `Your passport is valid for ${Math.floor(validity.days / 30)} months (${validity.days} days)`}
                    {validity?.status === "expiring" && `Your passport expires in ${validity.days} days. Consider renewing soon as many countries require 6 months validity.`}
                    {validity?.status === "expired" && `This passport expired ${Math.abs(validity.days)} days ago. Immediate renewal required for international travel.`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {draft.expireDate && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-lg text-xs font-medium text-slate-700">
                        <Calendar className="h-3.5 w-3.5" />
                        Expires: {new Date(draft.expireDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
          {/* Left Column - Primary Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Passport Identity Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 rounded-lg p-2">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Passport Identity</h2>
                    <p className="text-xs text-slate-600">Official document information</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField label="Passport Number" required icon={<FileText className="h-4 w-4" />}>
                    <Input
                      disabled={!editing}
                      value={draft.passportNo}
                      onChange={(e) =>
                        patch("passportNo", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                      }
                      placeholder="AB1234567"
                      className="font-mono text-lg font-semibold tracking-wider disabled:bg-slate-50 disabled:text-slate-900 h-12"
                    />
                    <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Enter as shown on passport document
                    </p>
                  </FormField>

                  <FormField label="Full Name on Passport" required icon={<User className="h-4 w-4" />}>
                    <Input
                      disabled={!editing}
                      value={draft.nameAsPassport}
                      onChange={(e) => patch("nameAsPassport", e.target.value.toUpperCase())}
                      placeholder="FULL LEGAL NAME"
                      className="uppercase font-semibold disabled:bg-slate-50 disabled:text-slate-900 h-12"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">Must match exactly as printed</p>
                  </FormField>
                </div>
              </div>
            </div>

            {/* Country Information Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 rounded-lg p-2">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Country Information</h2>
                    <p className="text-xs text-emerald-700">Nationality and issuing authority</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField label="Issuing Country" required icon={<MapPin className="h-4 w-4" />}>
                    <CountryAutocomplete
                      disabled={!editing}
                      value={draft.issueCountry}
                      onChange={(v) => {
                        patch("issueCountry", v);
                        if (!draft.nationality) patch("nationality", v);
                      }}
                    />
                    <p className="text-xs text-slate-500 mt-1.5">Country that issued this passport</p>
                  </FormField>

                  <FormField label="Nationality" required icon={<Globe className="h-4 w-4" />}>
                    <CountryAutocomplete
                      disabled={!editing}
                      value={draft.nationality}
                      onChange={(v) => patch("nationality", v)}
                    />
                    <p className="text-xs text-slate-500 mt-1.5">Citizenship status</p>
                  </FormField>
                </div>
              </div>
            </div>

            {/* Validity Dates Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500 rounded-lg p-2">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Validity Period</h2>
                    <p className="text-xs text-indigo-700">Issue and expiration dates</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField label="Issue Date" required icon={<Calendar className="h-4 w-4" />}>
                    <Input
                      type="date"
                      disabled={!editing}
                      value={draft.issueDate}
                      onChange={(e) => patch("issueDate", e.target.value)}
                      className="disabled:bg-slate-50 disabled:text-slate-900 h-12"
                    />
                  </FormField>

                  <FormField label="Expiration Date" required icon={<Calendar className="h-4 w-4" />}>
                    <Input
                      type="date"
                      disabled={!editing}
                      value={draft.expireDate}
                      onChange={(e) => patch("expireDate", e.target.value)}
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

                {/* Travel Advisory */}
                <div className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-4">
                  <div className="bg-amber-500 rounded-lg p-2 flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 mb-1">Travel Advisory</h4>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Renew your passport well in advance of your travel dates. Many visa applications also require passport validity extending beyond your planned stay.
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
                  <h3 className="text-white font-bold text-lg">Passport Summary</h3>
                </div>

                <div className="space-y-4">
                  <SummaryItem 
                    label="Passport Number" 
                    value={draft.passportNo || "Not provided"} 
                    mono 
                  />
                  <SummaryItem 
                    label="Full Name" 
                    value={draft.nameAsPassport || "Not provided"} 
                  />
                  <SummaryItem 
                    label="Nationality" 
                    value={draft.nationality || "Not provided"} 
                  />
                  <SummaryItem 
                    label="Issuing Country" 
                    value={draft.issueCountry || "Not provided"} 
                  />
                  
                  {draft.issueDate && (
                    <SummaryItem 
                      label="Issue Date" 
                      value={new Date(draft.issueDate).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })} 
                    />
                  )}
                  
                  {draft.expireDate && (
                    <SummaryItem 
                      label="Expiration Date" 
                      value={new Date(draft.expireDate).toLocaleDateString('en-US', { 
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
                  text="Most countries require at least 6 months of passport validity for entry"
                />
                <InfoItem 
                  icon={<Calendar className="h-4 w-4" />}
                  text="Passport renewal typically takes 6-8 weeks"
                />
                <InfoItem 
                  icon={<Globe className="h-4 w-4" />}
                  text="Some countries have specific entry requirements beyond passport validity"
                />
                <InfoItem 
                  icon={<FileText className="h-4 w-4" />}
                  text="Keep photocopies of your passport stored separately when traveling"
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
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  icon?: React.ReactElement;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
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