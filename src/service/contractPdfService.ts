export interface ContractPdfData {
  contractCode: string;
  staffName: string;
  contractType: string;
  status: string;
  effectiveDate: string;
  expirationDate: string;
  contractPeriodMonths: number;
  noticePeriodDays: number;
  salaryRateType: string;
  signatureDate: string;
  signedBy: string;
  termsAndConditions: string;
  salaryRows: {
    customName: string;
    amount: string;
    effectiveDate: string;
    note: string;
  }[];
}

function fmt(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: "#16a34a", DRAFT: "#d97706", EXPIRED: "#dc2626", TERMINATED: "#64748b",
  };
  return map[status] ?? "#64748b";
}

function contractTypeLabel(type: string): string {
  const map: Record<string, string> = {
    PERMANENT: "Permanent", TEMPORARY: "Temporary", CONTRACT: "Contract",
    PART_TIME: "Part Time", INTERN: "Intern", CONSULTANT: "Consultant", PROBATION: "Probation",
  };
  return map[type] ?? type;
}

function buildDoc(data: ContractPdfData): string {
  const validRows = data.salaryRows.filter((r) => r.customName && r.amount);
  const total = validRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const genDate = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });

  const allowanceRows = validRows.length > 0
    ? validRows.map((r, i) => `
        <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
          <td class="td-center">${i + 1}</td>
          <td class="td-name">${r.customName}</td>
          <td class="td-amount">${parseFloat(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          <td class="td-date">${fmt(r.effectiveDate)}</td>
          <td class="td-note">${r.note || "—"}</td>
        </tr>`).join("")
    : `<tr><td colspan="5" class="td-empty">No allowances defined</td></tr>`;

  const totalRow = validRows.length > 0 ? `
    <tr class="total-row">
      <td colspan="2">Total Compensation</td>
      <td>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      <td colspan="2"></td>
    </tr>` : "";

  const termsSection = data.termsAndConditions ? `
    <div class="section">
      <div class="section-title">Terms &amp; Conditions</div>
      <div class="terms-box">${data.termsAndConditions}</div>
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Contract – ${data.contractCode || data.staffName}</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      color: #1e293b;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page ── */
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 18mm 16mm;
      background: #fff;
    }

    @media print {
      html, body { margin: 0; padding: 0; }
      .page { width: 100%; padding: 12mm 14mm; }
      .no-print { display: none !important; }
      @page { size: A4 portrait; margin: 0; }
    }

    /* ── Print hint bar ── */
    .print-hint {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 20px;
      font-size: 12px;
      color: #1e40af;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .print-btn {
      background: #1e40af;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 6px 16px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      margin-left: auto;
    }

    /* ── Header ── */
    .header {
      display: table;
      width: 100%;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header-left, .header-right {
      display: table-cell;
      vertical-align: top;
    }
    .header-right { text-align: right; }
    .brand-name { font-size: 22px; font-weight: 800; color: #1e40af; }
    .brand-sub  { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
    .doc-title  { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.06em; }
    .doc-code   { font-size: 12px; color: #64748b; margin-top: 4px; font-family: monospace; }
    .status-badge {
      display: inline-block; margin-top: 6px;
      padding: 3px 12px; border-radius: 20px;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      color: #fff; background: ${statusColor(data.status)};
    }

    /* ── Sections ── */
    .section { margin-bottom: 22px; }
    .section-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.12em; color: #3b82f6;
      border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 12px;
    }

    /* ── Info grid (table-based) ── */
    .info-table { width: 100%; border-collapse: collapse; }
    .info-table td { padding: 5px 0; width: 33.33%; vertical-align: top; }
    .info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 2px; }
    .info-value { font-size: 13px; font-weight: 600; color: #0f172a; }

    /* ── Allowances table ── */
    .allowance-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; font-size: 13px; }
    .allowance-table thead tr { background: #1e40af; }
    .allowance-table thead th {
      padding: 10px 12px; text-align: left;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: #fff;
    }
    .allowance-table thead th.center { text-align: center; width: 36px; }
    .td-center { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; width: 36px; }
    .td-name   { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
    .td-amount { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #1e40af; width: 130px; }
    .td-date   { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; width: 130px; }
    .td-note   { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
    .td-empty  { padding: 16px; text-align: center; color: #94a3b8; font-size: 13px; }
    .row-even  { background: #f8fafc; }
    .row-odd   { background: #fff; }
    .total-row td { padding: 10px 12px; background: #eff6ff; font-weight: 700; color: #1e40af; border-top: 2px solid #3b82f6; }

    /* ── Terms ── */
    .terms-box {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
      padding: 14px; font-size: 12px; color: #475569; line-height: 1.7;
      white-space: pre-wrap;
    }

    /* ── Signatures ── */
    .sig-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .sig-table td { width: 50%; padding: 0; vertical-align: bottom; text-align: center; }
    .sig-table td:first-child { padding-right: 24px; }
    .sig-table td:last-child  { padding-left: 24px; }
    .sig-line  { margin-top: 52px; border-top: 2px solid #0f172a; padding-top: 8px; }
    .sig-label { font-size: 12px; font-weight: 700; color: #0f172a; }
    .sig-sub   { font-size: 11px; color: #94a3b8; margin-top: 2px; }

    /* ── Footer ── */
    .footer-table { width: 100%; border-collapse: collapse; border-top: 1px solid #e2e8f0; margin-top: 28px; }
    .footer-table td { font-size: 10px; color: #94a3b8; padding-top: 10px; }
    .footer-table td:last-child { text-align: right; }
  </style>
</head>
<body>
<div class="page">

  <!-- Print hint — hidden when printing -->
  <div class="print-hint no-print">
    <span>📄 To save as PDF: click <strong>Print / Save as PDF</strong> and choose <strong>"Save as PDF"</strong> as the destination.</span>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="brand-name">Sunway ERP</div>
      <div class="brand-sub">Human Resources &amp; Payroll</div>
    </div>
    <div class="header-right">
      <div class="doc-title">Employment Contract</div>
      <div class="doc-code">${data.contractCode || "—"}</div>
      <span class="status-badge">${data.status}</span>
    </div>
  </div>

  <!-- Contract Details -->
  <div class="section">
    <div class="section-title">Contract Details</div>
    <table class="info-table">
      <tr>
        <td><div class="info-label">Employee Name</div><div class="info-value">${data.staffName || "—"}</div></td>
        <td><div class="info-label">Contract Type</div><div class="info-value">${contractTypeLabel(data.contractType)}</div></td>
        <td><div class="info-label">Salary Rate</div><div class="info-value">${data.salaryRateType || "—"}</div></td>
      </tr>
      <tr>
        <td><div class="info-label">Effective Date</div><div class="info-value">${fmt(data.effectiveDate)}</div></td>
        <td><div class="info-label">Expiration Date</div><div class="info-value">${fmt(data.expirationDate)}</div></td>
        <td><div class="info-label">Contract Period</div><div class="info-value">${data.contractPeriodMonths ? `${data.contractPeriodMonths} months` : "—"}</div></td>
      </tr>
      <tr>
        <td><div class="info-label">Notice Period</div><div class="info-value">${data.noticePeriodDays ? `${data.noticePeriodDays} days` : "—"}</div></td>
        <td><div class="info-label">Signed By</div><div class="info-value">${data.signedBy || "—"}</div></td>
        <td><div class="info-label">Signature Date</div><div class="info-value">${fmt(data.signatureDate)}</div></td>
      </tr>
    </table>
  </div>

  <!-- Salary & Allowances -->
  <div class="section">
    <div class="section-title">Salary &amp; Allowances</div>
    <table class="allowance-table">
      <thead>
        <tr>
          <th class="center">#</th>
          <th>Allowance / Component</th>
          <th>Amount</th>
          <th>Effective Date</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        ${allowanceRows}
        ${totalRow}
      </tbody>
    </table>
  </div>

  ${termsSection}

  <!-- Signatures -->
  <div class="section">
    <div class="section-title">Signatures</div>
    <table class="sig-table">
      <tr>
        <td>
          <div class="sig-line">
            <div class="sig-label">${data.staffName || "Employee"}</div>
            <div class="sig-sub">Employee Signature &amp; Date</div>
          </div>
        </td>
        <td>
          <div class="sig-line">
            <div class="sig-label">${data.signedBy || "Authorized Signatory"}</div>
            <div class="sig-sub">Employer Signature &amp; Date</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <table class="footer-table">
    <tr>
      <td>This is a system-generated document. Generated on ${genDate}.</td>
      <td>Contract Ref: ${data.contractCode || "N/A"} | Sunway ERP</td>
    </tr>
  </table>

</div>
<script>
  // Auto-trigger print after page loads
  window.addEventListener("load", function() {
    window.print();
  });
</script>
</body>
</html>`;
}

export function downloadContractPdf(data: ContractPdfData): void {
  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("Popup blocked — please allow popups for this site and try again.");
  }
  win.document.open();
  win.document.write(buildDoc(data));
  win.document.close();
}
