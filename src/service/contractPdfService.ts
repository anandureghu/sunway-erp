export interface ContractPdfData {
  contractCode: string;
  status: string;

  // ── Contract meta ──
  contractDate: string; // yyyy-mm-dd — drives the "on this day <weekday>" line
  placeOfContract: string; // e.g. "Qatar"

  // ── First party (employer) ──
  employerName: string;
  employerAddress: string;

  // ── Second party (employee) ──
  staffName: string;
  education: string;
  nationality: string;
  personalId: string;
  residenceAddress: string;

  // ── Engagement ──
  jobTitle: string;
  jobSkillLevel: string; // e.g. "Skilled"

  // ── Contract terms ──
  contractType: string;
  effectiveDate: string;
  expirationDate: string;
  contractPeriodMonths: number;
  noticePeriodDays: number;
  salaryRateType: string;
  signatureDate: string;
  signedBy: string;
  termsAndConditions: string;

  // ── Salary breakdown ──
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
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function weekday(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: "#16a34a", DRAFT: "#d97706", EXPIRED: "#dc2626", TERMINATED: "#64748b",
  };
  return map[status] ?? "#64748b";
}

function salaryTypeLabel(type: string): string {
  const map: Record<string, string> = {
    MONTHLY: "Monthly", HOURLY: "Hourly", DAILY: "Daily", YEARLY: "Yearly",
  };
  return map[type] ?? (type || "—");
}

function esc(value: string): string {
  return (value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
}

function val(value: string): string {
  const v = (value ?? "").trim();
  return v ? esc(v) : "—";
}

function buildDoc(data: ContractPdfData): string {
  const validRows = data.salaryRows.filter((r) => r.customName && r.amount);
  const total = validRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const genDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

  const salaryBreakdownRows = validRows.length > 0
    ? validRows.map((r, i) => `
        <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
          <td class="td-center">${i + 1}</td>
          <td class="td-name">${esc(r.customName)}</td>
          <td class="td-amount">${parseFloat(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          <td class="td-note">${r.note ? esc(r.note) : "—"}</td>
        </tr>`).join("")
    : `<tr><td colspan="4" class="td-empty">No salary components defined</td></tr>`;

  const totalRow = validRows.length > 0 ? `
    <tr class="total-row">
      <td colspan="2">Total Compensation (${salaryTypeLabel(data.salaryRateType)})</td>
      <td>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      <td></td>
    </tr>` : "";

  const termsSection = data.termsAndConditions ? `
    <div class="section">
      <div class="section-title">Additional Terms &amp; Conditions</div>
      <div class="terms-box">${esc(data.termsAndConditions)}</div>
    </div>` : "";

  const skill = (data.jobSkillLevel || "").trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Employment Contract – ${esc(data.contractCode || data.staffName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      color: #1e293b;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

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

    /* Print hint bar */
    .print-hint {
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
      padding: 10px 16px; margin-bottom: 20px; font-size: 12px; color: #1e40af;
      display: flex; align-items: center; gap: 10px;
    }
    .print-btn {
      background: #1e40af; color: #fff; border: none; border-radius: 6px;
      padding: 6px 16px; font-size: 12px; font-weight: 600; cursor: pointer; margin-left: auto;
    }

    /* Header */
    .header { display: table; width: 100%; border-bottom: 3px solid #3b82f6; padding-bottom: 16px; margin-bottom: 20px; }
    .header-left, .header-right { display: table-cell; vertical-align: top; }
    .header-right { text-align: right; }
    .brand-name { font-size: 22px; font-weight: 800; color: #1e40af; }
    .brand-sub  { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
    .doc-title  { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.06em; }
    .doc-code   { font-size: 12px; color: #64748b; margin-top: 4px; font-family: monospace; }
    .status-badge {
      display: inline-block; margin-top: 6px; padding: 3px 12px; border-radius: 20px;
      font-size: 11px; font-weight: 700; text-transform: uppercase; color: #fff;
      background: ${statusColor(data.status)};
    }

    /* Preamble */
    .preamble { margin-bottom: 22px; font-size: 13px; line-height: 1.7; color: #334155; }
    .preamble .lead { font-size: 14px; }
    .preamble strong { color: #0f172a; }
    .place-line { margin-top: 6px; }
    .place-line .lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-right: 6px; }

    /* Sections */
    .section { margin-bottom: 20px; }
    .section-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #3b82f6;
      border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 12px;
    }
    .party-role { font-size: 12px; font-style: italic; color: #64748b; margin-bottom: 10px; }

    /* Info grid */
    .info-table { width: 100%; border-collapse: collapse; }
    .info-table td { padding: 6px 0; vertical-align: top; }
    .info-table td.half { width: 50%; }
    .info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 2px; }
    .info-value { font-size: 13px; font-weight: 600; color: #0f172a; }
    .info-value.addr { font-weight: 500; line-height: 1.6; }

    /* Agreement */
    .agreement { font-size: 13px; line-height: 1.8; color: #334155; }
    .agreement strong { color: #0f172a; }
    .skill-tag {
      display: inline-block; margin-left: 4px; padding: 1px 9px; border-radius: 12px;
      background: #eff6ff; color: #1e40af; font-size: 11px; font-weight: 700; text-transform: capitalize;
    }

    /* Salary table */
    .allowance-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; font-size: 13px; }
    .allowance-table thead tr { background: #1e40af; }
    .allowance-table thead th {
      padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em; color: #fff;
    }
    .allowance-table thead th.center { text-align: center; width: 36px; }
    .td-center { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; width: 36px; }
    .td-name   { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
    .td-amount { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #1e40af; width: 140px; }
    .td-note   { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
    .td-empty  { padding: 16px; text-align: center; color: #94a3b8; font-size: 13px; }
    .row-even  { background: #f8fafc; }
    .row-odd   { background: #fff; }
    .total-row td { padding: 10px 12px; background: #eff6ff; font-weight: 700; color: #1e40af; border-top: 2px solid #3b82f6; }

    /* Terms */
    .terms-box {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
      padding: 14px; font-size: 12px; color: #475569; line-height: 1.7; white-space: pre-wrap;
    }

    /* Governing law */
    .law-note {
      background: #f8fafc; border-left: 3px solid #3b82f6; border-radius: 4px;
      padding: 12px 16px; font-size: 12px; color: #475569; line-height: 1.7;
    }
    .law-note strong { color: #0f172a; }

    /* Signatures */
    .sig-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .sig-table td { width: 50%; padding: 0; vertical-align: bottom; text-align: center; }
    .sig-table td:first-child { padding-right: 24px; }
    .sig-table td:last-child  { padding-left: 24px; }
    .sig-line  { margin-top: 52px; border-top: 2px solid #0f172a; padding-top: 8px; }
    .sig-label { font-size: 12px; font-weight: 700; color: #0f172a; }
    .sig-sub   { font-size: 11px; color: #94a3b8; margin-top: 2px; }

    /* Footer */
    .footer-table { width: 100%; border-collapse: collapse; border-top: 1px solid #e2e8f0; margin-top: 26px; }
    .footer-table td { font-size: 10px; color: #94a3b8; padding-top: 10px; }
    .footer-table td:last-child { text-align: right; }
  </style>
</head>
<body>
<div class="page">

  <!-- Print hint -->
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
      <div class="doc-code">${val(data.contractCode)}</div>
      <span class="status-badge">${esc(data.status || "—")}</span>
    </div>
  </div>

  <!-- Preamble -->
  <div class="preamble">
    <div class="lead">It is on this day <strong>${weekday(data.contractDate)}</strong> corresponding to: <strong>${fmt(data.contractDate)}</strong>.</div>
    <div class="place-line"><span class="lbl">Place of Contract</span><strong>${val(data.placeOfContract)}</strong></div>
  </div>

  <!-- First Party -->
  <div class="section">
    <div class="section-title">First Party — Employer</div>
    <div class="party-role">In this capacity as the employer</div>
    <table class="info-table">
      <tr>
        <td class="half"><div class="info-label">Employer</div><div class="info-value">${val(data.employerName)}</div></td>
        <td class="half"><div class="info-label">Address</div><div class="info-value addr">${val(data.employerAddress)}</div></td>
      </tr>
    </table>
  </div>

  <!-- Second Party -->
  <div class="section">
    <div class="section-title">Second Party — Employee</div>
    <table class="info-table">
      <tr>
        <td class="half"><div class="info-label">Name of the Employee</div><div class="info-value">${val(data.staffName)}</div></td>
        <td class="half"><div class="info-label">Education</div><div class="info-value">${val(data.education)}</div></td>
      </tr>
      <tr>
        <td class="half"><div class="info-label">Nationality</div><div class="info-value">${val(data.nationality)}</div></td>
        <td class="half"><div class="info-label">Personal ID</div><div class="info-value">${val(data.personalId)}</div></td>
      </tr>
      <tr>
        <td colspan="2"><div class="info-label">Place of Residence</div><div class="info-value addr">${val(data.residenceAddress)}</div></td>
      </tr>
    </table>
  </div>

  <!-- Agreement -->
  <div class="section">
    <div class="section-title">Terms of Engagement</div>
    <div class="agreement">
      Both parties hereby agreed as follows: the second party shall work for the first party in the professional
      capacity of <strong>${val(data.jobTitle)}</strong>${skill ? `<span class="skill-tag">${esc(skill)}</span>` : ""}.
    </div>
  </div>

  <!-- Salary breakdown -->
  <div class="section">
    <div class="section-title">Salary Breakdown</div>
    <table class="allowance-table">
      <thead>
        <tr>
          <th class="center">#</th>
          <th>Component</th>
          <th>Amount</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        ${salaryBreakdownRows}
        ${totalRow}
      </tbody>
    </table>
  </div>

  ${termsSection}

  <!-- Governing law -->
  <div class="section">
    <div class="law-note">
      The <strong>Qatari Labour Law No. (14) of the year 2004</strong> and its enforcing regulations shall govern
      this contract and any matters not expressly provided for herein.
    </div>
  </div>

  <!-- Signatures -->
  <div class="section">
    <div class="section-title">Signatures</div>
    <table class="sig-table">
      <tr>
        <td>
          <div class="sig-line">
            <div class="sig-label">${val(data.staffName) === "—" ? "Second Party" : esc(data.staffName)}</div>
            <div class="sig-sub">Second Party (Employee) — Signature &amp; Date</div>
          </div>
        </td>
        <td>
          <div class="sig-line">
            <div class="sig-label">${data.signedBy ? esc(data.signedBy) : "First Party"}</div>
            <div class="sig-sub">First Party (Employer) — Signature &amp; Date</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <table class="footer-table">
    <tr>
      <td>This is a system-generated document. Generated on ${genDate}.</td>
      <td>Contract Ref: ${val(data.contractCode)} | Sunway ERP</td>
    </tr>
  </table>

</div>
<script>
  window.addEventListener("load", function() { window.print(); });
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
