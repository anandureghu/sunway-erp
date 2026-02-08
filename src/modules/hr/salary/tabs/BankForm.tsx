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

interface ValidationErrors {
  [key: string]: string;
}

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

  const validateForm = (data: BankModel): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!data.bankName) errors.bankName = "Bank name is required";
    if (!data.bankBranch) errors.bankBranch = "Bank branch is required";
    if (!data.accountType) errors.accountType = "Account type is required";
    if (!data.accountNo) errors.accountNo = "Account number is required";
    if (!data.country) errors.country = "Country is required";

    return errors;
  };

  const errors = validateForm(draft);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Bank Details</h2>
            <p className="text-sm text-slate-500 mt-1">Provide banking information for salary payment</p>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Bank Name</p>
              <p className="text-sm font-semibold text-blue-900">{draft.bankName || "Not set"}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Account Type</p>
              <p className="text-sm font-semibold text-emerald-900">{draft.accountType || "Not set"}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="bg-amber-600 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-amber-600 font-medium">Account Number</p>
              <p className="text-sm font-semibold text-amber-900">{draft.accountNo || "Not set"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* All Bank Information in One Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-800">Bank Information</h3>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Bank Information */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
              Bank Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Bank Name" required error={errors.bankName}>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={draft.bankName}
                    onChange={(e) => patch("bankName", e.target.value)}
                    required
                    placeholder="Enter bank name"
                  />
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Bank Branch" required error={errors.bankBranch}>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={draft.bankBranch}
                    onChange={(e) => patch("bankBranch", e.target.value)}
                    required
                    placeholder="Enter branch name"
                  />
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200"></div>

          {/* Account Details */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-emerald-600 rounded-full"></div>
              Account Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Account Type" required>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={draft.accountType}
                    onChange={(e) => patch("accountType", e.target.value)}
                    required
                    placeholder="e.g., Savings, Checking"
                  />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Account No" required>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={draft.accountNo}
                    onChange={(e) => patch("accountNo", e.target.value)}
                    required
                    placeholder="Enter account number"
                  />
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="IBAN/SWIFT Code">
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={draft.iban}
                    onChange={(e) => patch("iban", e.target.value)}
                    placeholder="International code"
                  />
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200"></div>

          {/* Location Details */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-amber-600 rounded-full"></div>
              Location Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="City">
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={draft.city}
                    onChange={(e) => patch("city", e.target.value)}
                    placeholder="Enter city"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="State">
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={draft.state}
                    onChange={(e) => patch("state", e.target.value)}
                    placeholder="Enter state/province"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Country" required>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={draft.country}
                    onChange={(e) => patch("country", e.target.value)}
                    required
                    placeholder="Enter country"
                  />
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200"></div>

          {/* Remarks */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-purple-600 rounded-full"></div>
              Additional Information
            </h4>
            <Field label="Bank Remarks">
              <Textarea
                className="min-h-[100px] border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                disabled={!editing}
                value={draft.remarks}
                onChange={(e) => patch("remarks", e.target.value)}
                placeholder="Enter any additional information or special instructions..."
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  error
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
          {error}
        </p>
      )}
    </div>
  );
}
