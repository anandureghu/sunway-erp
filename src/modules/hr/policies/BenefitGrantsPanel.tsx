import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertTriangle,
  Gift,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { canEditModule } from "@/lib/module-permissions";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { hrService } from "@/service/hr.service";
import {
  benefitGrantService,
  type BenefitGrant,
  type BenefitGrantType,
} from "@/service/benefitsAdjustmentService";

type Emp = {
  id: string | number;
  firstName?: string;
  lastName?: string;
  employeeNo?: string;
  status?: string;
};

const BENEFIT_TYPES: { value: BenefitGrantType; label: string; hint: string }[] = [
  {
    value: "ANNUAL_TICKET",
    label: "Annual Ticket",
    hint: "Once per calendar year per employee.",
  },
  { value: "BONUS", label: "Bonus", hint: "One-off bonus paid with the month's salary." },
  {
    value: "REIMBURSEMENT",
    label: "Reimbursement",
    hint: "Attach the receipt or invoice (PDF, image or Word, max 15 MB).",
  },
];

const TYPE_LABEL: Record<BenefitGrantType, string> = {
  ANNUAL_TICKET: "Annual Ticket",
  BONUS: "Bonus",
  REIMBURSEMENT: "Reimbursement",
};

const ACCEPTED_DOCS = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
const MAX_DOC_BYTES = 15 * 1024 * 1024;

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (value?: string | null) => {
  if (!value) return "—";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
};

const money = (n: number) =>
  Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * HR Policies → Benefits: grant a one-off annual ticket, bonus or reimbursement to an
 * employee. Grants are paid by the payroll run for the chosen pay month (or the next
 * run, if that month's payroll was already processed). An annual ticket is limited to
 * once per calendar year; a reimbursement needs a supporting document.
 */
export default function BenefitGrantsPanel() {
  const { permissions } = useAuth();
  const canEdit = canEditModule(permissions, "HR_SETTINGS");

  const [employees, setEmployees] = useState<Emp[]>([]);
  const [grants, setGrants] = useState<BenefitGrant[]>([]);
  const [loading, setLoading] = useState(true);

  const [employeeId, setEmployeeId] = useState("");
  const [benefitType, setBenefitType] = useState<BenefitGrantType | "">("");
  const [amount, setAmount] = useState("");
  const [payMonth, setPayMonth] = useState(currentMonth());
  const [description, setDescription] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [ticketWarning, setTicketWarning] = useState<BenefitGrant | null>(null);
  const [checkingTicket, setCheckingTicket] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadGrants = useCallback(async () => {
    try {
      setGrants(await benefitGrantService.list());
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not load benefits."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGrants();
    hrService
      .listEmployees()
      .then((list) =>
        setEmployees(
          (Array.isArray(list) ? (list as unknown as Emp[]) : []).filter(
            (e) => String(e.status ?? "").toUpperCase() !== "INACTIVE",
          ),
        ),
      )
      .catch(() => setEmployees([]));
  }, [loadGrants]);

  // Annual ticket is once a year: look up any ticket already granted in the pay
  // month's calendar year as soon as employee + month are chosen.
  useEffect(() => {
    setTicketWarning(null);
    if (benefitType !== "ANNUAL_TICKET" || !employeeId || !payMonth) return;
    let cancelled = false;
    setCheckingTicket(true);
    benefitGrantService
      .annualTicketCheck(Number(employeeId), payMonth)
      .then((res) => {
        if (!cancelled) setTicketWarning(res.alreadyGranted ? res.existing ?? null : null);
      })
      .catch(() => {
        if (!cancelled) setTicketWarning(null);
      })
      .finally(() => {
        if (!cancelled) setCheckingTicket(false);
      });
    return () => {
      cancelled = true;
    };
  }, [benefitType, employeeId, payMonth]);

  useEffect(() => {
    if (benefitType !== "REIMBURSEMENT") setDocument(null);
  }, [benefitType]);

  const empLabel = (e: Emp) =>
    `${[e.firstName, e.lastName].filter(Boolean).join(" ")}${
      e.employeeNo ? ` (${e.employeeNo})` : ""
    }`.trim();

  const selectedEmployee = employees.find((e) => String(e.id) === employeeId);
  const amountValue = parseFloat(amount);
  const needsDocument = benefitType === "REIMBURSEMENT";

  const canSubmit = useMemo(
    () =>
      canEdit &&
      !saving &&
      !checkingTicket &&
      !!employeeId &&
      !!benefitType &&
      !!payMonth &&
      amountValue > 0 &&
      (!needsDocument || !!document) &&
      !ticketWarning,
    [
      canEdit,
      saving,
      checkingTicket,
      employeeId,
      benefitType,
      payMonth,
      amountValue,
      needsDocument,
      document,
      ticketWarning,
    ],
  );

  const onPickFile = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_DOC_BYTES) {
      toast.error("The document must be 15 MB or smaller.");
      return;
    }
    setDocument(file);
  };

  const resetForm = () => {
    setEmployeeId("");
    setBenefitType("");
    setAmount("");
    setPayMonth(currentMonth());
    setDescription("");
    setDocument(null);
    setTicketWarning(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (!canSubmit || !benefitType) return;
    setSaving(true);
    try {
      await benefitGrantService.create(
        {
          employeeId: Number(employeeId),
          benefitType,
          amount: amountValue,
          payMonth,
          description: description.trim() || null,
        },
        needsDocument ? document : null,
      );
      toast.success(
        `${TYPE_LABEL[benefitType]} granted to ${
          selectedEmployee ? empLabel(selectedEmployee) : "the employee"
        } — paid with the ${monthLabel(payMonth)} payroll.`,
      );
      resetForm();
      loadGrants();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not grant the benefit."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (g: BenefitGrant) => {
    const ok = window.confirm(
      `Remove the ${TYPE_LABEL[g.benefitType]} of ${money(g.amount)} for ${
        g.employeeName ?? "this employee"
      }?`,
    );
    if (!ok) return;
    setDeletingId(g.id);
    try {
      await benefitGrantService.remove(g.id);
      toast.success("Benefit removed.");
      setGrants((prev) => prev.filter((x) => x.id !== g.id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the benefit."));
    } finally {
      setDeletingId(null);
    }
  };

  const labelCls =
    "text-[11px] font-semibold uppercase tracking-wider text-slate-500";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600">
          <Gift className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Employee Benefits</h3>
          <p className="text-[11px] text-slate-400">
            Grant an annual ticket, bonus or reimbursement — paid with the chosen
            month's payroll.
          </p>
        </div>
      </div>

      {!canEdit && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          You need HR settings edit permission to grant benefits.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Employee</label>
          <Select value={employeeId} onValueChange={setEmployeeId} disabled={!canEdit}>
            <SelectTrigger className="mt-1 h-9 text-sm">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {empLabel(e)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={labelCls}>Benefit type</label>
          <Select
            value={benefitType}
            onValueChange={(v) => setBenefitType(v as BenefitGrantType)}
            disabled={!canEdit}
          >
            <SelectTrigger className="mt-1 h-9 text-sm">
              <SelectValue placeholder="Select benefit type" />
            </SelectTrigger>
            <SelectContent>
              {BENEFIT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {benefitType && (
            <p className="mt-1 text-[10px] text-slate-400">
              {BENEFIT_TYPES.find((t) => t.value === benefitType)?.hint}
            </p>
          )}
        </div>

        <div>
          <label className={labelCls}>Amount</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={!canEdit}
            className="mt-1 h-9 text-sm"
          />
        </div>

        <div>
          <label className={labelCls}>Pay month</label>
          <Input
            type="month"
            value={payMonth}
            onChange={(e) => setPayMonth(e.target.value)}
            disabled={!canEdit}
            className="mt-1 h-9 text-sm"
          />
          <p className="mt-1 text-[10px] text-slate-400">
            Paid with this month's payroll (or the next run if it has already been
            processed).
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>Description</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            placeholder="Optional note, e.g. Doha–Kochi return ticket"
            disabled={!canEdit}
            className="mt-1 h-9 text-sm"
          />
        </div>

        {needsDocument && (
          <div className="sm:col-span-2">
            <label className={labelCls}>
              Supporting document <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_DOCS}
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            <div className="mt-1 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={!canEdit}
                onClick={() => fileRef.current?.click()}
              >
                <Paperclip className="mr-1.5 h-4 w-4" />
                {document ? "Replace document" : "Upload document"}
              </Button>
              {document ? (
                <span className="flex min-w-0 items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  <span className="truncate">{document.name}</span>
                  <button
                    type="button"
                    aria-label="Remove document"
                    className="text-slate-400 hover:text-red-500"
                    onClick={() => {
                      setDocument(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  PDF, JPG, PNG, DOC or DOCX — max 15 MB
                </span>
              )}
            </div>
          </div>
        )}

        {benefitType === "ANNUAL_TICKET" && ticketWarning && (
          <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>
                {ticketWarning.employeeName ??
                  (selectedEmployee ? empLabel(selectedEmployee) : "This employee")}
              </strong>{" "}
              has already received the annual ticket for{" "}
              {ticketWarning.payMonth?.slice(0, 4)} ({monthLabel(ticketWarning.payMonth)},{" "}
              {money(ticketWarning.amount)} —{" "}
              {ticketWarning.status === "PAID" ? "paid" : "pending payroll"}). The annual
              ticket can be granted once a year only.
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={submit} disabled={!canSubmit} className="h-9">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Grant benefit
        </Button>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <h4 className={`${labelCls} mb-2`}>Granted benefits</h4>
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : grants.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">
            No benefits granted yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Employee</th>
                  <th className="py-2 pr-3 font-semibold">Benefit</th>
                  <th className="py-2 pr-3 font-semibold">Pay month</th>
                  <th className="py-2 pr-3 text-right font-semibold">Amount</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 pr-3 font-semibold">Document</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {grants.map((g) => (
                  <tr key={g.id}>
                    <td className="py-2 pr-3">
                      <div className="font-medium">{g.employeeName ?? "—"}</div>
                      {g.employeeNo && (
                        <div className="text-[10px] text-slate-400">{g.employeeNo}</div>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <div>{g.benefitTypeLabel ?? TYPE_LABEL[g.benefitType]}</div>
                      {g.description && (
                        <div className="max-w-[220px] truncate text-[10px] text-slate-400">
                          {g.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{monthLabel(g.payMonth)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{money(g.amount)}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          g.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {g.status === "PAID" ? "Paid" : "Pending payroll"}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      {g.documentUrl ? (
                        <a
                          href={g.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-violet-600 hover:underline"
                        >
                          <Paperclip className="h-3.5 w-3.5" /> View
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {canEdit && g.status !== "PAID" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                          disabled={deletingId === g.id}
                          onClick={() => remove(g)}
                          aria-label="Remove benefit"
                        >
                          {deletingId === g.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
