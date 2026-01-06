import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReactElement } from "react";
import type { ImmigrationCtx } from "../ImmigrationShell";
import { toast } from "sonner";
import { immigrationService, type ResidencePermitPayload } from "@/service/immigrationService";

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
  startDate: string; // yyyy-mm-dd
  endDate: string;   // yyyy-mm-dd
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="form" aria-label="Residence permit form">
      {/* row 1 */}
      <Field label="Visa Type" required>
        <Select
          disabled={!editing}
          value={draft.visaType}
          onChange={(v) => patch("visaType", v)}
          options={VISA_TYPES}
          label="Visa type"
          aria-required="true"
        />
      </Field>
      <Field label="ID" required>
        <Input
          type="text"
          disabled={!editing}
          value={draft.idNumber}
          onChange={(e) => patch("idNumber", e.target.value)}
          aria-label="Identification number"
          aria-required="true"
          required
        />
      </Field>

      {/* row 2 */}
      <Field label="Duration Type" required>
        <Select
          disabled={!editing}
          value={draft.durationType}
          onChange={(v) => patch("durationType", v)}
          options={DURATION_TYPES}
          label="Duration type"
          aria-required="true"
        />
      </Field>
      <Field label="Nationality" required>
        <Input
          type="text"
          disabled={!editing}
          value={draft.nationality}
          onChange={(e) => patch("nationality", e.target.value)}
          aria-label="Nationality"
          aria-required="true"
          required
        />
      </Field>

      {/* row 3 */}
      <Field label="Visa Duration" required>
        <Input
          type="text"
          disabled={!editing}
          value={draft.visaDuration}
          onChange={(e) => patch("visaDuration", e.target.value)}
          aria-label="Visa duration"
          aria-required="true"
          required
        />
      </Field>
      <Field label="Occupation" required>
        <Input
          type="text"
          disabled={!editing}
          value={draft.occupation}
          onChange={(e) => patch("occupation", e.target.value)}
          aria-label="Occupation"
          aria-required="true"
          required
        />
      </Field>

      {/* row 4 */}
      <Field label="Issue Place" required>
        <Input
          type="text"
          disabled={!editing}
          value={draft.issuePlace}
          onChange={(e) => patch("issuePlace", e.target.value)}
          aria-label="Place of issue"
          aria-required="true"
          required
        />
      </Field>
      <Field label="Issue Authority" required>
        <Input
          type="text"
          disabled={!editing}
          value={draft.issueAuthority}
          onChange={(e) => patch("issueAuthority", e.target.value)}
          aria-label="Issuing authority"
          aria-required="true"
          required
        />
      </Field>

      {/* row 5 */}
      <Field label="Visa Status" required>
        <Select
          disabled={!editing}
          value={draft.visaStatus}
          onChange={(v) => patch("visaStatus", v)}
          options={VISA_STATUS}
          label="Visa status"
          aria-required="true"
        />
      </Field>
      <div />

      {/* row 6 */}
      <Field label="Start Date" required>
        <Input
          type="date"
          disabled={!editing}
          value={draft.startDate}
          onChange={(e) => patch("startDate", e.target.value)}
          aria-label="Start date"
          aria-required="true"
          required
        />
      </Field>
      <Field label="End Date" required>
        <Input
          type="date"
          disabled={!editing}
          value={draft.endDate}
          onChange={(e) => patch("endDate", e.target.value)}
          aria-label="End date"
          aria-required="true"
          required
        />
      </Field>
    </div>
  );
}

function Field({ label, children, required }: FieldProps & { required?: boolean }) {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="space-y-1.5" role="group">
      <Label className="text-sm" htmlFor={fieldId}>
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
      className="h-9 w-full rounded-md border px-3 text-sm disabled:bg-muted/40 disabled:text-muted-foreground"
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
