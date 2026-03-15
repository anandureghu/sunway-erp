// ============================================================
 //  PayslipDocument.tsx
 //  React component that renders the full payslip.
 //  Pixel-faithful to sunway-erp-payslip.html UI reference.
 //
 //  Props:
 //    data: PayslipData — pass the combined object from your API
 //
 //  Usage:
 //    <PayslipDocument data={payslipData} />
 //
 //  For printing, wrap in a <div> and call window.print(),
 //  or use react-to-pdf / html2canvas as shown below.
 // ============================================================

import React from "react";
import type { PayslipData } from "@/types/hr";
import {
  computePayslipValues,
  formatCurrency,
  formatDate,
  formatPayPeriod,
  maskAccountNumber,
} from "../utils/payslip.utils";

// ─── Inline styles (matches payslip HTML CSS variables exactly) ─

const CSS = {
  // Colors
  gold: "#C9A84C",
  goldLight: "#E8D5A0",
  dark: "#1A1A2E",
  navy: "#16213E",
  slate: "#2C3E6B",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6178",
  textMuted: "#8B91A8",
  borderLight: "#E8EAF0",
  bgCream: "#FAFAF7",
  earningsGreen: "#2D8A56",
  deductionsRed: "#C0392B",
  white: "#FFFFFF",
} as const;

// ─── Sub-components ────────────────────────────────────────────

const InfoItem: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
}> = ({ label, value, mono = false }) => (
  <div>
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: CSS.textMuted,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        marginBottom: 3,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: CSS.textPrimary,
        fontFamily: mono ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
      }}
    >
      {value}
    </div>
  </div>
);

const SectionTitle: React.FC<{
  type: "earnings" | "deductions" | "info";
  icon: string;
  title: string;
}> = ({ type, icon, title }) => {
  const colors = {
    earnings: { color: CSS.earningsGreen, bg: "#F6FBF8", iconBg: "rgba(45,138,86,0.1)" },
    deductions: { color: CSS.deductionsRed, bg: "#FDF7F6", iconBg: "rgba(192,57,43,0.1)" },
    info: { color: CSS.slate, bg: "#F4F5FA", iconBg: "rgba(44,62,107,0.1)" },
  }[type];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "2.5px",
        textTransform: "uppercase",
        padding: "14px 40px",
        color: colors.color,
        backgroundColor: colors.bg,
        borderTop: `1px solid ${CSS.borderLight}`,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          width: 20,
          height: 20,
          borderRadius: 5,
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          backgroundColor: colors.iconBg,
        }}
      >
        {icon}
      </span>
      {title}
      {/* trailing line */}
      <div style={{ flex: 1, height: 1, backgroundColor: CSS.borderLight }} />
    </div>
  );
};

const PayslipTable: React.FC<{
  rows: { label: string; amount: number; negative?: boolean }[];
  currency: string;
}> = ({ rows, currency }) => (
  <table style={{ width: "100%", borderCollapse: "collapse" }}>
    <thead>
      <tr>
        <th
          style={{
            width: "55%",
            fontSize: 10,
            fontWeight: 600,
            color: CSS.textMuted,
            letterSpacing: "1px",
            textTransform: "uppercase",
            padding: "10px 40px",
            textAlign: "left",
            borderBottom: `1px solid ${CSS.borderLight}`,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Description
        </th>
        <th
          style={{
            width: "45%",
            fontSize: 10,
            fontWeight: 600,
            color: CSS.textMuted,
            letterSpacing: "1px",
            textTransform: "uppercase",
            padding: "10px 40px",
            textAlign: "right",
            borderBottom: `1px solid ${CSS.borderLight}`,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Amount ({currency})
        </th>
      </tr>
    </thead>
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td
            colSpan={2}
            style={{
              padding: "16px 40px",
              textAlign: "center",
              color: CSS.textMuted,
              fontSize: 12,
              fontStyle: "italic",
            }}
          >
            No entries
          </td>
        </tr>
      ) : (
        rows.map((row, i) => (
          <tr key={i}>
            <td
              style={{
                padding: "12px 40px",
                fontSize: 14,
                fontWeight: 500,
                color: CSS.textPrimary,
                borderBottom: i < rows.length - 1 ? "1px solid #F2F3F5" : "none",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {row.label}
            </td>
            <td
              style={{
                padding: "12px 40px",
                fontSize: 13,
                fontWeight: 500,
                textAlign: "right",
                borderBottom: i < rows.length - 1 ? "1px solid #F2F3F5" : "none",
                fontFamily: "'JetBrains Mono', monospace",
                color: row.negative ? CSS.deductionsRed : CSS.earningsGreen,
              }}
            >
              {row.negative ? "−" : ""}
              {formatCurrency(row.amount, currency)}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
);

const SummaryCard: React.FC<{
  type: "gross" | "deduct" | "net";
  label: string;
  amount: number;
  currency: string;
}> = ({ type, label, amount, currency }) => {
  const styles = {
    gross: {
      bg: "#F0F6F3",
      border: "1px solid #D4E8DC",
      labelColor: CSS.earningsGreen,
      amountColor: CSS.earningsGreen,
    },
    deduct: {
      bg: "#FDF5F4",
      border: "1px solid #F0D5D1",
      labelColor: CSS.deductionsRed,
      amountColor: CSS.deductionsRed,
    },
    net: {
      bg: `linear-gradient(135deg, ${CSS.dark}, ${CSS.navy})`,
      border: "1px solid transparent",
      labelColor: CSS.gold,
      amountColor: CSS.white,
    },
  }[type];

  return (
    <div
      style={{
        borderRadius: 8,
        padding: 20,
        textAlign: "center",
        background: styles.bg,
        border: styles.border,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* gold top bar for net card */}
      {type === "net" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${CSS.gold}, ${CSS.goldLight})`,
          }}
        />
      )}
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: 8,
          color: styles.labelColor,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 22,
          fontWeight: 700,
          color: styles.amountColor,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.7, marginRight: 2 }}>
          {currency}{" "}
        </span>
        {formatCurrency(amount, currency)}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────

interface PayslipDocumentProps {
  data: PayslipData;
  /** Optional ref forwarded for use with html2canvas / react-to-pdf */
  printRef?: React.RefObject<HTMLDivElement>;
}

export const PayslipDocument: React.FC<PayslipDocumentProps> = ({
  data,
  printRef,
}) => {
  const { employee, payroll, bankDetails } = data;
  const computed = computePayslipValues(data);
  const currency = employee.currency.currencyCode;

  const earningRows = computed.earnings.map((e) => ({
    label: e.label,
    amount: e.amount,
    negative: false as const,
  }));

  const deductionRows = computed.deductions.map((d) => ({
    label: d.label,
    amount: d.amount,
    negative: true as const,
  }));

  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      ref={printRef}
      style={{
        width: 820,
        backgroundColor: CSS.white,
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 40px rgba(0,0,0,0.06)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${CSS.dark} 0%, ${CSS.navy} 60%, ${CSS.slate} 100%)`,
          padding: "32px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* gold bottom line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${CSS.gold}, ${CSS.goldLight}, ${CSS.gold})`,
          }}
        />
        {/* left — branding */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: `linear-gradient(135deg, ${CSS.gold}, ${CSS.goldLight})`,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: 22,
                color: CSS.dark,
              }}
            >
              S
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 24,
                fontWeight: 700,
                color: CSS.white,
                letterSpacing: "0.5px",
              }}
            >
              Sunway <span style={{ color: CSS.gold }}>Group</span>
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginLeft: 58,
            }}
          >
            ERP Payroll System
          </div>
        </div>
        {/* right — period */}
        <div style={{ textAlign: "right", position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: CSS.gold,
              letterSpacing: "4px",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Payslip
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: CSS.white }}>
            {formatPayPeriod(payroll.payPeriodStart)}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
              marginTop: 4,
            }}
          >
            REF: {payroll.payrollCode}
          </div>
        </div>
      </div>

      {/* ── Employee Info ── */}
      <div
        style={{
          padding: "28px 40px",
          backgroundColor: CSS.bgCream,
          borderBottom: `1px solid ${CSS.borderLight}`,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        {/* left group */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px 24px",
          }}
        >
          <InfoItem label="Employee Name" value={`${employee.firstName} ${employee.lastName}`} />
          <InfoItem label="Employee ID" value={employee.employeeCode || employee.employeeNo || ''} mono />
          <InfoItem label="Department" value={employee.department || ''} />
          <InfoItem label="Designation" value={employee.designation || ''} />
        </div>
        {/* right group */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px 24px",
          }}
        >
          <InfoItem label="Date of Joining" value={formatDate(employee.dateOfJoining || employee.joinDate || '')} mono />
          <InfoItem label="Pay Grade" value={employee.payGrade || "—"} mono />
          <InfoItem
            label="Working Days"
            value={
              employee.totalDays != null
                ? `${employee.workingDays ?? "—"} / ${employee.totalDays}`
                : `${employee.workingDays ?? "—"}`
            }
            mono
          />
          <InfoItem
            label="Leave Taken"
            value={employee.leaveTaken != null ? `${employee.leaveTaken} days` : "0 days"}
            mono
          />
        </div>
      </div>

      {/* ── Earnings ── */}
      <SectionTitle type="earnings" icon="↑" title="Earnings" />
      <PayslipTable rows={earningRows} currency={currency} />

      {/* ── Deductions ── */}
      <SectionTitle type="deductions" icon="↓" title="Deductions" />
      <PayslipTable rows={deductionRows} currency={currency} />

      {/* ── Summary ── */}
      <div style={{ padding: "24px 40px 0" }}>
        <div style={{ height: 1, backgroundColor: CSS.borderLight }} />
      </div>
      <div
        style={{
          padding: "0 40px 32px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginTop: 8,
        }}
      >
        <SummaryCard
          type="gross"
          label="Gross Earnings"
          amount={computed.grossPay}
          currency={currency}
        />
        <SummaryCard
          type="deduct"
          label="Total Deductions"
          amount={computed.totalDeductions}
          currency={currency}
        />
        <SummaryCard
          type="net"
          label="Net Pay"
          amount={computed.netPayable}
          currency={currency}
        />
      </div>

      {/* ── Bank Details ── */}
      <div
        style={{
          padding: "20px 40px",
          backgroundColor: CSS.bgCream,
          borderTop: `1px solid ${CSS.borderLight}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 32 }}>
          <InfoItem label="Bank" value={bankDetails.bankName} />
          <InfoItem label="Branch" value={bankDetails.bankBranch} />
          <InfoItem
            label="Account No."
            value={maskAccountNumber(bankDetails.accountNo)}
            mono
          />
          <InfoItem label="Payment Date" value={formatDate(payroll.payDate)} mono />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            backgroundColor: "rgba(45,138,86,0.08)",
            border: "1px solid rgba(45,138,86,0.15)",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            color: CSS.earningsGreen,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: CSS.earningsGreen,
              display: "inline-block",
            }}
          />
          Paid via Bank Transfer
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: "20px 40px",
          borderTop: `1px solid ${CSS.borderLight}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: CSS.textMuted,
            lineHeight: 1.6,
            maxWidth: 400,
          }}
        >
          This is a system-generated payslip from Sunway ERP. No signature is required.
          <br />
          For discrepancies, contact HR within 7 working days of issuance.
        </div>
        <div
          style={{
            textAlign: "right",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: CSS.textMuted,
            lineHeight: 1.8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: CSS.gold,
            }}
          >
            Sunway ERP v4.2
          </div>
          Generated: {generatedAt}
          <br />
          Document ID: {payroll.payrollCode}
        </div>
      </div>
    </div>
  );
};

export default PayslipDocument;

