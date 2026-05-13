"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { CreatePaymentDTO, PaymentResponseDTO } from "@/types/payment";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { toISO } from "@/lib/utils";
import {
  DollarSign,
  Calendar,
  X,
  FileText,
  CreditCard,
} from "lucide-react";

export function PaymentDialog({
  open,
  onOpenChange,
  data,
  companyId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PaymentResponseDTO | null;
  companyId: number;
  onSuccess: (updated: PaymentResponseDTO, mode: "add" | "edit") => void;
}) {
  const isEdit = !!data;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<CreatePaymentDTO>({
    companyId,
    amount: 0,
    paymentMethod: "",
    effectiveDate: "",
    notes: "",
    invoiceId: "",
  });

  const update = (key: keyof CreatePaymentDTO, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (data) {
      setForm({
        companyId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        effectiveDate: toISO(data.effectiveDate),
        notes: "",
        invoiceId: data.invoiceId ?? "",
      });
    }
  }, [data, companyId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = data
        ? await apiClient.put(`/finance/payments/${data.id}`, form)
        : await apiClient.post(`/finance/payments`, form);
      onSuccess(res.data, data ? "edit" : "add");
      toast.success("Payment saved");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 560, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Top bar ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-emerald-100 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {data ? "Edit payment" : "Add customer payment"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {data
                  ? "Update payment details and method"
                  : "Record a new customer payment"}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div
          className="overflow-y-auto bg-white px-6 py-5"
          style={{ maxHeight: "calc(92vh - 132px)" }}
        >
          <div className="space-y-5">

            {/* ── Section: Payment Details ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                  <CreditCard className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Payment details
                </span>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Amount
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <DollarSign className="h-[15px] w-[15px]" />
                      </span>
                      <Input
                        type="number"
                        value={form.amount || ""}
                        onChange={(e) => update("amount", Number(e.target.value))}
                        placeholder="0.00"
                        className="h-10 pl-9 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Payment method
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <CreditCard className="h-[15px] w-[15px]" />
                      </span>
                      <Input
                        value={form.paymentMethod}
                        onChange={(e) => update("paymentMethod", e.target.value)}
                        placeholder="BANK_TRANSFER, CASH"
                        className="h-10 pl-9 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Effective date
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <Calendar className="h-[15px] w-[15px]" />
                      </span>
                      <Input
                        type="date"
                        value={form.effectiveDate}
                        onChange={(e) => update("effectiveDate", e.target.value)}
                        className="h-10 pl-9 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Invoice ID
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <FileText className="h-[15px] w-[15px]" />
                      </span>
                      <Input
                        value={form.invoiceId ?? ""}
                        onChange={(e) => update("invoiceId", e.target.value)}
                        placeholder="INV-00001 (optional)"
                        className="h-10 pl-9 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Notes
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                      <FileText className="h-[15px] w-[15px]" />
                    </span>
                    <Input
                      value={form.notes ?? ""}
                      onChange={(e) => update("notes", e.target.value)}
                      placeholder="Optional notes for this payment"
                      className="h-10 pl-9 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            Amount and payment method are required
          </p>
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </span>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Save payment"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
