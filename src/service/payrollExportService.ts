import axios from "axios";
import { apiClient } from "@/service/apiClient";

export interface PayrollExportSettings {
  payrollEmployerEid?: string | null;
  payrollPayerEid?: string | null;
  payrollPayerQid?: string | null;
  payrollPayerBankShortName?: string | null;
  payrollPayerIban?: string | null;
  payrollSifVersion?: string | null;
}

export function isPayrollExportSettingsComplete(s: PayrollExportSettings | null | undefined): boolean {
  if (!s) return false;
  const req = [
    s.payrollEmployerEid?.trim(),
    s.payrollPayerEid?.trim(),
    s.payrollPayerBankShortName?.trim(),
    s.payrollPayerIban?.trim(),
  ];
  return req.every(Boolean);
}

export const payrollExportService = {
  getSettings(companyId: string | number) {
    return apiClient.get<PayrollExportSettings>(
      `/companies/${companyId}/payroll-export-settings`,
    );
  },

  updateSettings(companyId: string | number, payload: PayrollExportSettings) {
    return apiClient.put<PayrollExportSettings>(
      `/companies/${companyId}/payroll-export-settings`,
      payload,
    );
  },

  downloadBankPayrollCsv(companyId: string | number, yearMonth: string) {
    return apiClient.get<Blob>(`/companies/${companyId}/payroll/bank-payroll.csv`, {
      params: { yearMonth },
      responseType: "blob",
    });
  },
};

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Downloads CSV or throws with server message when validation fails (400). */
export async function downloadBankPayrollCsvFile(
  companyId: string | number,
  yearMonth: string,
): Promise<void> {
  try {
    const res = await payrollExportService.downloadBankPayrollCsv(companyId, yearMonth);
    const blob = res.data as Blob;
    const ct = res.headers["content-type"] ?? "";
    if (ct.includes("application/json")) {
      const text = await blob.text();
      const j = JSON.parse(text) as { message?: string };
      throw new Error(j.message ?? "Payroll export failed");
    }
    triggerBlobDownload(blob, `payroll-${yearMonth}.csv`);
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
      const text = await err.response.data.text();
      try {
        const j = JSON.parse(text) as { message?: string; details?: string[] };
        const detailMsg =
          j.details?.length ? `${j.message ?? "Validation failed"}: ${j.details.join("; ")}` : j.message;
        throw new Error(detailMsg ?? "Payroll export failed");
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) {
          throw new Error(text || "Payroll export failed");
        }
        throw parseErr;
      }
    }
    throw err;
  }
}
