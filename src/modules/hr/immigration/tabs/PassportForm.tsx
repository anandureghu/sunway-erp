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

type ImmigrationEvent = "immigration:save" | "immigration:cancel" | "immigration:edit";

type PassportModel = {
  passportNo: string;
  issueCountry: string;
  nameAsPassport: string;
  nationality: string;
  issueDate: string; // yyyy-mm-dd
  expireDate: string; // yyyy-mm-dd
};

const SEED: PassportModel = {
  passportNo: "",
  issueCountry: "",
  nameAsPassport: "",
  nationality: "",
  issueDate: "",
  expireDate: "",
};

export default function PassportForm(): ReactElement {
  const { editing } = useOutletContext<ImmigrationCtx>();

  const [saved, setSaved] = useState<PassportModel>(SEED);
  const [draft, setDraft] = useState<PassportModel>(SEED);

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

  const patch = useCallback(<K extends keyof PassportModel>(k: K, v: PassportModel[K]) => 
    setDraft(d => ({ ...d, [k]: v })), []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="form" aria-label="Passport information form">
      <Field label="Passport No">
        <Input
          type="text"
          disabled={!editing}
          value={draft.passportNo}
          onChange={(e) => patch("passportNo", e.target.value)}
          aria-label="Passport number"
          aria-required="true"
        />
      </Field>

      <Field label="Issue Country">
        <Input
          type="text"
          disabled={!editing}
          value={draft.issueCountry}
          onChange={(e) => patch("issueCountry", e.target.value)}
          aria-label="Country of issue"
          aria-required="true"
        />
      </Field>

      <Field label="Name as Passport">
        <Input
          type="text"
          disabled={!editing}
          value={draft.nameAsPassport}
          onChange={(e) => patch("nameAsPassport", e.target.value)}
          aria-label="Name as shown on passport"
          aria-required="true"
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

      <Field label="Issue Date">
        <Input
          type="date"
          disabled={!editing}
          value={draft.issueDate}
          onChange={(e) => patch("issueDate", e.target.value)}
          aria-label="Date of issue"
          aria-required="true"
        />
      </Field>

      <Field label="Expire Date">
        <Input
          type="date"
          disabled={!editing}
          value={draft.expireDate}
          onChange={(e) => patch("expireDate", e.target.value)}
          aria-label="Expiration date"
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

// Duplicate Field implementation removed — single Field implementation kept above.
