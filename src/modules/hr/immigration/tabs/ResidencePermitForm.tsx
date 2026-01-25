import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import CountryAutocomplete from "@/modules/hr/components/CountryAutocomplete";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { ReactElement } from "react";
import type { ImmigrationCtx } from "../ImmigrationShell";
import { toast } from "sonner";
import { immigrationService, type ResidencePermitPayload } from "@/service/immigrationService";
import { FileText, Calendar, CheckCircle, AlertTriangle, XCircle, Building,  Clock } from "lucide-react";

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

interface SelectProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  label: string;
}

type ImmigrationEvent = "immigration:save" | "immigration:cancel" | "immigration:edit";

type ResidencePermitModel = {
  visaType: string;
  idNumber: string;
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
  idNumber: "",
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
  const [draft, setDraft] = useState<ResidencePermitModel>(SEED);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!empId) return;
      try {
        const data = await immigrationService.getResidencePermit(empId);
        if (mounted && data) {
          const model: ResidencePermitModel = {
            visaType: data.visaType ?? "",
            idNumber: data.idNumber ?? "",
            issuePlace: data.issuePlace ?? "",
            durationType: data.durationType ?? "",
            nationality: data.nationality ?? "",
            issueAuthority: data.issueAuthority ?? "",
            visaDuration: data.visaDuration ?? "",
            occupation: data.occupation ?? "",
            visaStatus: data.visaStatus ?? "",
            startDate: data.startDate ?? "",
            endDate: data.endDate ?? "",
          };
          setSaved(model);
          setDraft(model);
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

    // Check status first
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
    const payload: ResidencePermitPayload = {
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
      if (saved && (saved.idNumber || saved.visaType)) {
        await immigrationService.updateResidencePermit(empId, payload);
        toast.success("Residence permit updated");
      } else {
        await immigrationService.createResidencePermit(empId, payload);
        toast.success("Residence permit created");
      }
      const fresh = await immigrationService.getResidencePermit(empId);
      if (fresh) {
        const model: ResidencePermitModel = {
          visaType: fresh.visaType ?? "",
          idNumber: fresh.idNumber ?? "",
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
          gradient: "from-emerald-500 to-teal-600",
          bgGradient: "from-emerald-50 to-teal-50",
          border: "border-emerald-200",
          icon: CheckCircle,
          title: "Visa Active",
          description: `Valid for ${validity.days} more days (approximately ${Math.floor(validity.days / 30)} months)`,
          badge: "ACTIVE",
          badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
        };
      case "expiring":
        return {
          gradient: "from-amber-500 to-orange-600",
          bgGradient: "from-amber-50 to-orange-50",
          border: "border-amber-200",
          icon: AlertTriangle,
          title: "Visa Expiring Soon",
          description: `Valid for ${validity.days} more days. Please arrange renewal.`,
          badge: "EXPIRING SOON",
          badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
        };
      case "expired":
        return {
          gradient: "from-red-500 to-rose-600",
          bgGradient: "from-red-50 to-rose-50",
          border: "border-red-200",
          icon: XCircle,
          title: draft.visaStatus === "Cancelled" ? "Visa Cancelled" : "Visa Expired",
          description: draft.visaStatus === "Cancelled" 
            ? "This visa has been cancelled and is no longer valid." 
            : validity.days < 0 
            ? `This visa expired ${Math.abs(validity.days)} days ago. Please renew immediately.`
            : "This visa is no longer valid.",
          badge: draft.visaStatus === "Cancelled" ? "CANCELLED" : "EXPIRED",
          badgeClass: "bg-red-100 text-red-700 border-red-200",
        };
      case "pending":
        return {
          gradient: "from-blue-500 to-indigo-600",
          bgGradient: "from-blue-50 to-indigo-50",
          border: "border-blue-200",
          icon: Clock,
          title: "Pending Status",
          description: "Visa application is currently under review",
          badge: "PENDING",
          badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
        };
      default:
        return null;
    }
  };

  const validityConfig = getValidityConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full opacity-20 blur-3xl -mr-32 -mt-32"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Residence Permit & Visa</h1>
                <p className="text-slate-600">Enter visa and residence permit information</p>
              </div>
            </div>
          </div>
        </div>

        {/* VALIDITY STATUS CARD */}
        {validityConfig && (
          <Card className={`overflow-hidden shadow-lg border-l-4 ${validityConfig.border}`}>
            <CardContent className="p-0">
              <div className={`bg-gradient-to-r ${validityConfig.bgGradient} p-6`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 bg-gradient-to-br ${validityConfig.gradient} rounded-xl text-white shadow-lg`}>
                    <validityConfig.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{validityConfig.title}</h3>
                    <p className="text-sm text-slate-600">{validityConfig.description}</p>
                    <div className="mt-3 inline-block">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${validityConfig.badgeClass}`}>
                        {validityConfig.badge}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visa Details Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 pb-3 border-b border-slate-200 flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            Visa Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Visa Type" required>
              <Select
                disabled={!editing}
                value={draft.visaType}
                onChange={(v) => patch("visaType", v)}
                options={VISA_TYPES}
                label="Visa type"
              />
            </Field>

            <Field label="ID" required>
              <Input
                type="text"
                disabled={!editing}
                value={draft.idNumber}
                onChange={(e) => patch("idNumber", e.target.value)}
                placeholder="Enter visa/permit ID number"
                className="rounded-lg border-slate-300 font-mono uppercase"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Unique identification number</p>
            </Field>

            <Field label="Duration Type" required>
              <Select
                disabled={!editing}
                value={draft.durationType}
                onChange={(v) => patch("durationType", v)}
                options={DURATION_TYPES}
                label="Duration type"
              />
            </Field>

            <Field label="Nationality" required>
              <CountryAutocomplete
                value={draft.nationality}
                onChange={(v) => patch("nationality", v)}
                disabled={!editing}
                placeholder="Select nationality"
              />
            </Field>

            <Field label="Visa Duration" required>
              <Input
                type="text"
                disabled={!editing}
                value={draft.visaDuration}
                onChange={(e) => patch("visaDuration", e.target.value)}
                placeholder="e.g., 90 days, 1 year"
                className="rounded-lg border-slate-300"
                required
              />
            </Field>

            <Field label="Occupation" required>
              <Input
                type="text"
                disabled={!editing}
                value={draft.occupation}
                onChange={(e) => patch("occupation", e.target.value)}
                placeholder="Enter occupation"
                className="rounded-lg border-slate-300"
                required
              />
            </Field>
          </div>
        </div>

        {/* Issuing Authority Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 pb-3 border-b border-slate-200 flex items-center gap-2">
            <Building className="h-6 w-6 text-blue-600" />
            Issuing Authority
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Issue Place" required>
              <Input
                type="text"
                disabled={!editing}
                value={draft.issuePlace}
                onChange={(e) => patch("issuePlace", e.target.value)}
                placeholder="City or location of issue"
                className="rounded-lg border-slate-300"
                required
              />
            </Field>

            <Field label="Issue Authority" required>
              <Input
                type="text"
                disabled={!editing}
                value={draft.issueAuthority}
                onChange={(e) => patch("issueAuthority", e.target.value)}
                placeholder="Government department or embassy"
                className="rounded-lg border-slate-300"
                required
              />
              <p className="text-xs text-slate-500 mt-1">e.g., Immigration Department, Embassy</p>
            </Field>

            <Field label="Visa Status" required>
              <Select
                disabled={!editing}
                value={draft.visaStatus}
                onChange={(v) => patch("visaStatus", v)}
                options={VISA_STATUS}
                label="Visa status"
              />
            </Field>
          </div>
        </div>

        {/* Validity Period Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 pb-3 border-b border-slate-200 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-emerald-600" />
            Validity Period
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Start Date" required>
              <Input
                type="date"
                disabled={!editing}
                value={draft.startDate}
                onChange={(e) => patch("startDate", e.target.value)}
                className="rounded-lg border-slate-300"
                required
              />
            </Field>

            <Field label="End Date" required>
              <Input
                type="date"
                disabled={!editing}
                value={draft.endDate}
                onChange={(e) => patch("endDate", e.target.value)}
                className="rounded-lg border-slate-300"
                required
              />
            </Field>
          </div>

          {draft.startDate && draft.endDate && (
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Validity Period</p>
                  <p className="text-xs text-slate-600 mt-1">
                    From {new Date(draft.startDate).toLocaleDateString()} to {new Date(draft.endDate).toLocaleDateString()}
                    {(() => {
                      const start = new Date(draft.startDate);
                      const end = new Date(draft.endDate);
                      const totalDays = Math.floor((end.getTime() - start.getTime()) / 86400000);
                      return ` (${totalDays} days total)`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, required }: FieldProps & { required?: boolean }) {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="space-y-2" role="group">
      <Label className="text-sm font-medium text-slate-700" htmlFor={fieldId}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div id={fieldId}>
        {children}
      </div>
    </div>
  );
}

function Select({ value, options, onChange, disabled, label }: SelectProps): ReactElement {
  const selectId = `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <select
      id={selectId}
      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-muted/40 disabled:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
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
