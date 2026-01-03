import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReactElement } from "react";
import type { ImmigrationCtx } from "../ImmigrationShell";
import { toast } from "sonner";
import { immigrationService, type PassportPayload } from "@/service/immigrationService";

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
  const { id } = useParams<{ id: string }>();
  const empId = id ? Number(id) : undefined;

  const [saved, setSaved] = useState<PassportModel>(SEED);
  const [draft, setDraft] = useState<PassportModel>(SEED);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!empId) return;
      try {
        const data = await immigrationService.getPassport(empId);
        if (mounted && data) {
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
        }
      } catch (err: any) {
        console.error("PassportForm -> failed to load:", err?.response?.data ?? err);
      }
    })();
    return () => { mounted = false; };
  }, [empId]);

  const handleEdit = useCallback(() => setDraft(saved), [saved]);
  const handleCancel = useCallback(() => setDraft(saved), [saved]);

  const handleSave = useCallback(async () => {
    if (!empId) return;
    const payload: PassportPayload = {
      passportNo: draft.passportNo,
      nameAsPassport: draft.nameAsPassport,
      issueCountry: draft.issueCountry,
      nationality: draft.nationality,
      issueDate: draft.issueDate || undefined,
      expiryDate: draft.expireDate || undefined,
    } as any;

    try {
      
      if (saved && (saved.passportNo || saved.nameAsPassport)) {
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
      console.error("PassportForm -> save failed:", err?.response?.data ?? err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to save passport");
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

  const patch = useCallback(<K extends keyof PassportModel>(k: K, v: PassportModel[K]) =>
    setDraft(d => ({ ...d, [k]: v })), [setDraft]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="form" aria-label="Passport information form">
      <Field label="Passport No" required>
        <Input
          type="text"
          disabled={!editing}
          value={draft.passportNo}
          onChange={(e) => patch("passportNo", e.target.value)}
          aria-label="Passport number"
          aria-required="true"
          required
        />
      </Field>

      <Field label="Issue Country" required>
        <Input
          type="text"
          disabled={!editing}
          value={draft.issueCountry}
          onChange={(e) => patch("issueCountry", e.target.value)}
          aria-label="Country of issue"
          aria-required="true"
          required
        />
      </Field>

      <Field label="Name as Passport" required>
        <Input
          type="text"
          disabled={!editing}
          value={draft.nameAsPassport}
          onChange={(e) => patch("nameAsPassport", e.target.value)}
          aria-label="Name as shown on passport"
          aria-required="true"
          required
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

      <Field label="Issue Date" required>
        <Input
          type="date"
          disabled={!editing}
          value={draft.issueDate}
          onChange={(e) => patch("issueDate", e.target.value)}
          aria-label="Date of issue"
          aria-required="true"
          required
        />
      </Field>

      <Field label="Expire Date" required>
        <Input
          type="date"
          disabled={!editing}
          value={draft.expireDate}
          onChange={(e) => patch("expireDate", e.target.value)}
          aria-label="Expiration date"
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

 
