import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SalaryCtx = { editing: boolean };

type BankModel = {
  location: string;
  city: string;
  bankName: string;
  state: string;
  bankBranch: string;
  country: string;
  accountType: string;
  bankRemarks: string;
  accountNo: string;
  iban: string;
};

const SEED: BankModel = {
  location: "",
  city: "",
  bankName: "",
  state: "",
  bankBranch: "",
  country: "",
  accountType: "",
  bankRemarks: "",
  accountNo: "",
  iban: "",
};

export default function BankForm() {
  const { editing } = useOutletContext<SalaryCtx>();
  const [saved, setSaved] = useState<BankModel>(SEED);
  const [draft, setDraft] = useState<BankModel>(SEED);

  useEffect(() => {
    const onSave = () => setSaved(draft);
    const onCancel = () => setDraft(saved);
    document.addEventListener("salary:save", onSave as EventListener);
    document.addEventListener("salary:cancel", onCancel as EventListener);
    return () => {
      document.removeEventListener("salary:save", onSave as EventListener);
      document.removeEventListener("salary:cancel", onCancel as EventListener);
    };
  }, [draft, saved]);

  const patch = <K extends keyof BankModel>(k: K, v: BankModel[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Row>
        <Field label="Location:">
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.location}
            onChange={(e) => patch("location", e.target.value)}
          />
        </Field>
        <Field label="City:">
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.city}
            onChange={(e) => patch("city", e.target.value)}
          />
        </Field>
      </Row>

      <Row>
        <Field label="Bank Name:" required>
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.bankName}
            onChange={(e) => patch("bankName", e.target.value)}
            required
          />
        </Field>
        <Field label="State:">
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.state}
            onChange={(e) => patch("state", e.target.value)}
          />
        </Field>
      </Row>

      <Row>
        <Field label="Bank Branch:" required>
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.bankBranch}
            onChange={(e) => patch("bankBranch", e.target.value)}
            required
          />
        </Field>
        <Field label="Country:" required>
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.country}
            onChange={(e) => patch("country", e.target.value)}
            required
          />
        </Field>
      </Row>

      <Row>
        <Field label="Account Type:" required>
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.accountType}
            onChange={(e) => patch("accountType", e.target.value)}
            required
          />
        </Field>
        <Field label="Bank Remarks:">
          <Textarea
            className="min-h-[100px] w-full"
            disabled={!editing}
            value={draft.bankRemarks}
            onChange={(e) => patch("bankRemarks", e.target.value)}
          />
        </Field>
      </Row>

      <Row>
        <Field label="Account No:" required>
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.accountNo}
            onChange={(e) => patch("accountNo", e.target.value)}
            required
          />
        </Field>
        <Field label="IBAN:">
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.iban}
            onChange={(e) => patch("iban", e.target.value)}
          />
        </Field>
      </Row>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}
function Field({ label, children, required }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}
