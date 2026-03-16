// src/utils/payslip.utils.ts

import type { PayslipData, EarningItem, DeductionItem } from "@/types/hr";

export type { EarningItem, DeductionItem };

// ── Computed values shape ──────────────────────────────
export interface ComputedPayslipValues {
  earnings:         EarningItem[];
  deductions:       DeductionItem[];
  grossPay:         number;
  totalDeductions:  number;
  netPayable:       number;
}

// ── Used by PayslipDocument.tsx ────────────────────────
export function computePayslipValues(data: PayslipData): ComputedPayslipValues {
  const earnings     = data.earnings    ?? [];
  const deductions   = data.deductions  ?? [];
  const grossPay     = data.payroll.grossPay        ?? earnings.reduce((s, e) => s + (e.amount ?? 0), 0);
  const totalDeductions = data.payroll.totalDeductions ?? deductions.reduce((s, d) => s + (d.amount ?? 0), 0);
  const netPayable   = data.payroll.netPayable      ?? grossPay - totalDeductions;

  return { earnings, deductions, grossPay, totalDeductions, netPayable };
}

// ── Formatting helpers ─────────────────────────────────
export function formatCurrency(amount: number, _currency?: string): string {
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}

export function formatPayPeriod(payPeriodStart?: string): string {
  if (!payPeriodStart) return "—";
  const d = new Date(payPeriodStart);
  if (isNaN(d.getTime())) return payPeriodStart;
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function maskAccountNumber(accountNo?: string | null): string {
  if (!accountNo) return "—";
  const clean = accountNo.replace(/[-\s]/g, "");
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 4)} •••• ${clean.slice(-4)}`;
}