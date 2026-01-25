import { useEffect, useState, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, MapPin, CreditCard, Globe, FileText } from "lucide-react";
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

    const requiredFields = [
      { field: 'bankName', label: 'Bank Name' },
      { field: 'bankBranch', label: 'Bank Branch' },
      { field: 'accountType', label: 'Account Type' },
      { field: 'accountNo', label: 'Account No' },
      { field: 'country', label: 'Country' }
    ];

    const missingFields = requiredFields.filter(({ field }) => !draft[field as keyof BankModel]?.toString().trim());

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(({ label }) => label).join(', ');
      toast.error(`Please fill in all required fields: ${fieldNames}`);
      throw new Error(`Missing required fields: ${fieldNames}`);
    }

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
  }, [draft, saved, employeeId, exists, handleSaveBank]);

  const patch = <K extends keyof BankModel>(k: K, v: BankModel[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Bank Details
        </h2>
        <p className="text-sm text-slate-500 mt-1">Provide banking information for salary payment</p>
      </div>

      {/* Bank Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          Bank Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Bank Name" required icon={<Building2 className="h-4 w-4" />}>
            <Input
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={!editing}
              value={draft.bankName}
              onChange={(e) => patch("bankName", e.target.value)}
              required
              placeholder="Enter bank name"
            />
          </Field>
          <Field label="Bank Branch" required icon={<Building2 className="h-4 w-4" />}>
            <Input
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={!editing}
              value={draft.bankBranch}
              onChange={(e) => patch("bankBranch", e.target.value)}
              required
              placeholder="Enter branch name"
            />
          </Field>
        </div>
      </div>

      {/* Account Details Section */}
      <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg border border-blue-100 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-blue-600" />
          Account Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Account Type" required icon={<CreditCard className="h-4 w-4" />}>
            <Input
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
              disabled={!editing}
              value={draft.accountType}
              onChange={(e) => patch("accountType", e.target.value)}
              required
              placeholder="e.g., Savings, Checking"
            />
          </Field>

          <Field label="Account No" required icon={<FileText className="h-4 w-4" />}>
            <Input
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
              disabled={!editing}
              value={draft.accountNo}
              onChange={(e) => patch("accountNo", e.target.value)}
              required
              placeholder="Enter account number"
            />
          </Field>

          <Field label="IBAN/SWIFT Code" icon={<Globe className="h-4 w-4" />}>
            <Input
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
              disabled={!editing}
              value={draft.iban}
              onChange={(e) => patch("iban", e.target.value)}
              placeholder="International code"
            />
          </Field>
        </div>
      </div>

      {/* Location Details Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          Location Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Location" icon={<MapPin className="h-4 w-4" />}>
            <Input
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={!editing}
              value={draft.location}
              onChange={(e) => patch("location", e.target.value)}
              placeholder="Enter location"
            />
          </Field>
          <Field label="City" icon={<MapPin className="h-4 w-4" />}>
            <Input
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={!editing}
              value={draft.city}
              onChange={(e) => patch("city", e.target.value)}
              placeholder="Enter city"
            />
          </Field>
          <Field label="State" icon={<MapPin className="h-4 w-4" />}>
            <Input
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={!editing}
              value={draft.state}
              onChange={(e) => patch("state", e.target.value)}
              placeholder="Enter state/province"
            />
          </Field>
          <Field label="Country" required icon={<Globe className="h-4 w-4" />}>
            <Input
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={!editing}
              value={draft.country}
              onChange={(e) => patch("country", e.target.value)}
              required
              placeholder="Enter country"
            />
          </Field>
        </div>
      </div>

      {/* Remarks Section */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200 p-6">
        <Field label="Bank Remarks" icon={<FileText className="h-4 w-4" />}>
          <Textarea
            className="min-h-[100px] border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none bg-white"
            disabled={!editing}
            value={draft.remarks}
            onChange={(e) => patch("remarks", e.target.value)}
            placeholder="Enter any additional information or special instructions..."
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  icon
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  icon?: React.ReactElement;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}
