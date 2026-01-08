import { useEffect, useState, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bankService } from "@/service/bankService";
import { toast } from "sonner";

type SalaryCtx = { editing: boolean };

type BankModel = {
  location: string;
  city: string;
  bankName: string;
  state: string;
  bankBranch: string;
  country: string;
  accountType: string;
  remarks: string;
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
  remarks: "",
  accountNo: "",
  iban: "",
};

export default function BankForm() {
  const { editing } = useOutletContext<SalaryCtx>();
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;

  const [saved, setSaved] = useState<BankModel>(SEED);
  const [draft, setDraft] = useState<BankModel>(SEED);
  const [exists, setExists] = useState(false);

  const handleSaveBank = useCallback(async () => {
    if (!employeeId) return;
    const api = exists ? bankService.update : bankService.create;
    try {
      await api(employeeId, draft);
      toast.success("Bank details saved");
      setSaved(draft);
      setExists(true);
    } catch (err: any) {
      console.error("Failed to save bank details", err);
      toast.error(err?.response?.data?.message || "Failed to save bank details");
      throw err;
    }
  }, [employeeId, exists, draft]);

  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;
    bankService
      .get(employeeId)
      .then((res) => {
        if (!mounted) return;
        if (res.data) {
          setDraft(res.data);
          setSaved(res.data);
          setExists(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load bank details", err);
        toast.error(err?.response?.data?.message || "Failed to load bank details");
      });
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  useEffect(() => {
    const onCancel = () => setDraft(saved);

    document.addEventListener("salary:save", handleSaveBank as EventListener);
    document.addEventListener("salary:cancel", onCancel as EventListener);
    return () => {
      document.removeEventListener("salary:save", handleSaveBank as EventListener);
      document.removeEventListener("salary:cancel", onCancel as EventListener);
    };
  }, [draft, saved, employeeId, exists]);

  const patch = <K extends keyof BankModel>(k: K, v: BankModel[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="space-y-3">
     <div className="text-lg font-semibold">Bank Details </div>
      {/* Row 1: Bank Name + Bank Branch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Bank Name:" required>
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.bankName}
            onChange={(e) => patch("bankName", e.target.value)}
            required
          />
        </Field>
        <Field label="Bank Branch:" required>
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.bankBranch}
            onChange={(e) => patch("bankBranch", e.target.value)}
            required
          />
        </Field>
      </div>

      {/* Row 2: Account Type, Account No, IBAN/SWIFT Code */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Account Type:" required>
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.accountType}
            onChange={(e) => patch("accountType", e.target.value)}
            required
          />
        </Field>

        <Field label="Account No:" required>
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.accountNo}
            onChange={(e) => patch("accountNo", e.target.value)}
            required
          />
        </Field>

        <Field label="IBAN/SWIFT Code:">
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.iban}
            onChange={(e) => patch("iban", e.target.value)}
          />
        </Field>
      </div>

      {/* Row 3: Location, City, State, Country */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <Field label="State:">
          <Input
            className="w-full"
            disabled={!editing}
            value={draft.state}
            onChange={(e) => patch("state", e.target.value)}
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
      </div>

      {/* Bank remarks full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Bank Remarks:">
          <Textarea
            className="min-h-[100px] w-full"
            disabled={!editing}
            value={draft.remarks}
            onChange={(e) => patch("remarks", e.target.value)}
          />
        </Field>
        <div />
      </div>
    </div>
  );
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
