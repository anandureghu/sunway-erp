// modules/hr/employee/tabs/ContactInfoForm.tsx
import { useOutletContext } from "react-router-dom";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Ctx = { editing: boolean };

type ContactInfo = {
  email: string;
  phone: string;
  altPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  notes: string;
};

const SEED: ContactInfo = {
  email: "aisha.rahman@example.com",
  phone: "+91 99999 12345",
  altPhone: "",
  addressLine1: "12, Palm Street",
  addressLine2: "Near Lotus Mall",
  city: "Bengaluru",
  state: "KA",
  zipcode: "560001",
  country: "India",
  emergencyName: "Rahman Ali",
  emergencyRelation: "Father",
  emergencyPhone: "+91 99999 54321",
  notes: "",
};

export default function ContactInfoForm() {
  const { editing } = useOutletContext<Ctx>();

  const [saved, setSaved] = useState(SEED);
  const [draft, setDraft] = useState(SEED);

  useMemo(() => {
    const onSave = () => setSaved(draft);
    const onCancel = () => setDraft(saved);
    const onEdit = () => setDraft(saved);
    const s = () => onSave();
    const c = () => onCancel();
    const e = () => onEdit();
    document.addEventListener("profile:save", s as EventListener);
    document.addEventListener("profile:cancel", c as EventListener);
    document.addEventListener("profile:edit", e as EventListener);
    return () => {
      document.removeEventListener("profile:save", s as EventListener);
      document.removeEventListener("profile:cancel", c as EventListener);
      document.removeEventListener("profile:edit", e as EventListener);
    };
  }, [draft, saved]);

  const set = <K extends keyof ContactInfo>(k: K, v: ContactInfo[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="space-y-6">
      {/* Two-column: left = Address, right = Emergency Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field label="Address Line 1">
            <Input
              disabled={!editing}
              value={draft.addressLine1}
              onChange={(e) => set("addressLine1", e.target.value)}
            />
          </Field>

          <Field label="Address Line 2">
            <Input
              disabled={!editing}
              value={draft.addressLine2}
              onChange={(e) => set("addressLine2", e.target.value)}
            />
          </Field>

          <Field label="City">
            <Input
              disabled={!editing}
              value={draft.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>

          <Field label="State">
            <Input
              disabled={!editing}
              value={draft.state}
              onChange={(e) => set("state", e.target.value)}
            />
          </Field>

          <Field label="Postal Code">
            <Input
              disabled={!editing}
              value={draft.zipcode}
              onChange={(e) => set("zipcode", e.target.value)}
            />
          </Field>

          <Field label="Country">
            <Input
              disabled={!editing}
              value={draft.country}
              onChange={(e) => set("country", e.target.value)}
            />
          </Field>
        </div>

        <div className="space-y-4">
          <Field label="Emergency Contact Name">
            <Input
              disabled={!editing}
              value={draft.emergencyName}
              onChange={(e) => set("emergencyName", e.target.value)}
            />
          </Field>

          <Field label="Relationship">
            <Input
              disabled={!editing}
              value={draft.emergencyRelation}
              onChange={(e) => set("emergencyRelation", e.target.value)}
            />
          </Field>

          <Field label="Emergency Phone">
            <Input
              disabled={!editing}
              value={draft.emergencyPhone}
              onChange={(e) => set("emergencyPhone", e.target.value)}
            />
          </Field>

          <Field label="Notes">
            <Textarea
              disabled={!editing}
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="min-h-[80px]"
            />
          </Field>
        </div>
      </div>

      {/* Full-width Notes/Remarks */}
      <div className="space-y-1.5">
        <Label className="text-sm">Notes/Remarks:</Label>
        <Textarea
          disabled={!editing}
          value={draft.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="min-h-[100px] w-full"
        />
      </div>
    </div>
  );
}

/* layout helpers */
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
