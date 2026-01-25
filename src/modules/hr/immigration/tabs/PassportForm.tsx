import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import CountryAutocomplete from "@/modules/hr/components/CountryAutocomplete";
import { Label } from "@/components/ui/label";
import type { ReactElement } from "react";
import type { ImmigrationCtx } from "../ImmigrationShell";
import { toast } from "sonner";
import { immigrationService, type PassportPayload } from "@/service/immigrationService";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Calendar, CheckCircle, AlertTriangle, XCircle, FileText } from "lucide-react";

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

  /* ================= RENDER ================= */

  const getValidityConfig = () => {
    if (!validity) return null;

    switch (validity.status) {
      case "valid":
        return {
          gradient: "from-emerald-500 to-teal-600",
          bgGradient: "from-emerald-50 to-teal-50",
          border: "border-emerald-200",
          icon: CheckCircle,
          title: "Passport Valid",
          description: `Valid for ${validity.days} more days (approximately ${Math.floor(validity.days / 30)} months)`,
        };
      case "expiring":
        return {
          gradient: "from-amber-500 to-orange-600",
          bgGradient: "from-amber-50 to-orange-50",
          border: "border-amber-200",
          icon: AlertTriangle,
          title: "Passport Expiring Soon",
          description: `Valid for ${validity.days} more days. Many countries require 6 months validity for entry.`,
        };
      case "expired":
        return {
          gradient: "from-red-500 to-rose-600",
          bgGradient: "from-red-50 to-rose-50",
          border: "border-red-200",
          icon: XCircle,
          title: "Passport Expired",
          description: `This passport expired ${Math.abs(validity.days)} days ago. Please renew immediately.`,
        };
      default:
        return null;
    }
  };

  const validityConfig = getValidityConfig();
  const ValidityIcon = validityConfig?.icon ?? CheckCircle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-20 blur-3xl -mr-32 -mt-32"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Passport Information</h1>
                <p className="text-slate-600">Enter passport details for travel and identification</p>
              </div>
            </div>
          </div>
        </div>

        {/* VALIDITY CARD */}
        {validityConfig && (
          <Card className={`overflow-hidden shadow-lg border-l-4 ${validityConfig.border}`}>
            <CardContent className={`p-0`}>
              <div className={`bg-gradient-to-r ${validityConfig.bgGradient} p-6`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 bg-gradient-to-br ${validityConfig.gradient} rounded-xl text-white shadow-lg`}>
                    <ValidityIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{validityConfig.title}</h3>
                    <p className="text-sm text-slate-600">{validityConfig.description}</p>
                    <div className="mt-3 inline-block">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                        validity?.status === "valid"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : validity?.status === "expiring"
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-red-100 text-red-700 border border-red-200"
                      }`}>
                        {validity?.status === "valid" ? "Valid" : validity?.status === "expiring" ? "Expiring Soon" : "Expired"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Passport Details Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 pb-3 border-b border-slate-200 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Passport Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Passport No" required>
              <Input
                disabled={!editing}
                value={draft.passportNo}
                onChange={(e) =>
                  patch("passportNo", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                }
                placeholder="e.g., AB1234567"
                className="rounded-lg border-slate-300 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">Enter passport number as shown on document</p>
            </Field>

            <Field label="Issue Country" required>
              <CountryAutocomplete
                disabled={!editing}
                value={draft.issueCountry}
                onChange={(v) => {
                  patch("issueCountry", v);
                  if (!draft.nationality) patch("nationality", v);
                }}
              />
            </Field>

            <Field label="Name as Passport" required containerClassName="md:col-span-2">
              <Input
                disabled={!editing}
                value={draft.nameAsPassport}
                onChange={(e) => patch("nameAsPassport", e.target.value.toUpperCase())}
                placeholder="Full name exactly as shown on passport"
                className="rounded-lg border-slate-300 uppercase"
              />
              <p className="text-xs text-slate-500 mt-1">Enter name exactly as it appears on your passport</p>
            </Field>

            <Field label="Nationality" required>
              <CountryAutocomplete
                disabled={!editing}
                value={draft.nationality}
                onChange={(v) => patch("nationality", v)}
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
            <Field label="Issue Date" required>
              <div className="relative">
                <Input
                  type="date"
                  disabled={!editing}
                  value={draft.issueDate}
                  onChange={(e) => patch("issueDate", e.target.value)}
                  className="rounded-lg border-slate-300"
                />
              </div>
            </Field>

            <Field label="Expire Date" required>
              <div className="relative">
                <Input
                  type="date"
                  disabled={!editing}
                  value={draft.expireDate}
                  onChange={(e) => patch("expireDate", e.target.value)}
                  className="rounded-lg border-slate-300"
                />
              </div>
            </Field>
          </div>

          {draft.issueDate && draft.expireDate && (
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Validity Period</p>
                  <p className="text-xs text-slate-600 mt-1">
                    From {new Date(draft.issueDate).toLocaleDateString()} to {new Date(draft.expireDate).toLocaleDateString()}
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

/* ================= FIELD ================= */

function Field({
  label,
  children,
  required,
  containerClassName = "",
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  containerClassName?: string;
}) {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}
