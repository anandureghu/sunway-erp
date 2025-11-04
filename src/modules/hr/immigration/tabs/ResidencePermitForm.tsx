import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReactElement } from "react";
import type { ImmigrationCtx } from "../ImmigrationShell";

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

  const [saved, setSaved] = useState<ResidencePermitModel>(SEED);
  const [draft, setDraft] = useState<ResidencePermitModel>(SEED);

  // Memoized event handlers
  const handleEdit = useCallback(() => setDraft(saved), [saved]);
  const handleSave = useCallback(() => setSaved(draft), [draft]);
  const handleCancel = useCallback(() => setDraft(saved), [saved]);

  // React to shell events with proper cleanup
  useEffect(() => {
    const eventHandlers: Record<ImmigrationEvent, () => void> = {
      "immigration:edit": handleEdit,
      "immigration:save": handleSave,
      "immigration:cancel": handleCancel,
    };

    // Add event listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      document.addEventListener(event, handler as EventListener);
    });

    // Cleanup event listeners
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        document.removeEventListener(event, handler as EventListener);
      });
    };
  }, [handleEdit, handleSave, handleCancel]);

  const patch = useCallback(<K extends keyof ResidencePermitModel>(k: K, v: ResidencePermitModel[K]) =>
    setDraft(d => ({ ...d, [k]: v })), []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="form" aria-label="Residence permit form">
      {/* row 1 */}
      <Field label="Visa Type">
        <Select
          disabled={!editing}
          value={draft.visaType}
          onChange={(v) => patch("visaType", v)}
          options={VISA_TYPES}
          label="Visa type"
        />
      </Field>
      <Field label="ID">
        <Input
          type="text"
          disabled={!editing}
          value={draft.idNumber}
          onChange={(e) => patch("idNumber", e.target.value)}
          aria-label="Identification number"
          aria-required="true"
        />
      </Field>

      {/* row 2 */}
      <Field label="Duration Type">
        <Select
          disabled={!editing}
          value={draft.durationType}
          onChange={(v) => patch("durationType", v)}
          options={DURATION_TYPES}
          label="Duration type"
        />
      </Field>
      <Field label="Nationality">
        <Input
          type="text"
          disabled={!editing}
          value={draft.nationality}
          onChange={(e) => patch("nationality", e.target.value)}
          aria-label="Nationality"
          aria-required="true"
        />
      </Field>

      {/* row 3 */}
      <Field label="Visa Duration">
        <Input
          type="text"
          disabled={!editing}
          value={draft.visaDuration}
          onChange={(e) => patch("visaDuration", e.target.value)}
          aria-label="Visa duration"
          aria-required="true"
        />
      </Field>
      <Field label="Occupation">
        <Input
          type="text"
          disabled={!editing}
          value={draft.occupation}
          onChange={(e) => patch("occupation", e.target.value)}
          aria-label="Occupation"
          aria-required="true"
        />
      </Field>

      {/* row 4 */}
      <Field label="Issue Place">
        <Input
          type="text"
          disabled={!editing}
          value={draft.issuePlace}
          onChange={(e) => patch("issuePlace", e.target.value)}
          aria-label="Place of issue"
          aria-required="true"
        />
      </Field>
      <Field label="Issue Authority">
        <Input
          type="text"
          disabled={!editing}
          value={draft.issueAuthority}
          onChange={(e) => patch("issueAuthority", e.target.value)}
          aria-label="Issuing authority"
          aria-required="true"
        />
      </Field>

      {/* row 5 */}
      <Field label="Visa Status">
        <Select
          disabled={!editing}
          value={draft.visaStatus}
          onChange={(v) => patch("visaStatus", v)}
          options={VISA_STATUS}
          label="Visa status"
        />
      </Field>
      <div />

      {/* row 6 */}
      <Field label="Start Date">
        <Input
          type="date"
          disabled={!editing}
          value={draft.startDate}
          onChange={(e) => patch("startDate", e.target.value)}
          aria-label="Start date"
          aria-required="true"
        />
      </Field>
      <Field label="End Date">
        <Input
          type="date"
          disabled={!editing}
          value={draft.endDate}
          onChange={(e) => patch("endDate", e.target.value)}
          aria-label="End date"
          aria-required="true"
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: FieldProps): ReactElement {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className="space-y-1.5" role="group">
      <Label className="text-sm" htmlFor={fieldId}>
        {label}
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
