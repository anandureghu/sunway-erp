import { apiClient } from "@/service/apiClient";

export const downloadPayslipPdf = async (
  employeeId: number,
  payrollCode: string
): Promise<void> => {
  const response = await apiClient.get(
    `/employees/${employeeId}/payroll/${payrollCode}/payslip`,
    { responseType: "blob" }
  );

  if (response.status !== 200) {
    throw new Error(`Failed to download payslip: ${response.statusText}`);
  }

  const blob = response.data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `payslip-${payrollCode}.pdf`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
};

export const previewPayslipPdf = async (
  employeeId: number,
  payrollCode: string
): Promise<void> => {
  const response = await apiClient.get(
    `/employees/${employeeId}/payroll/${payrollCode}/payslip`,
    { responseType: "blob" }
  );

  if (response.status !== 200) {
    throw new Error(`Failed to preview payslip: ${response.statusText}`);
  }

  const blob = response.data;
  const url = URL.createObjectURL(
    new Blob([blob], { type: "application/pdf" })
  );

  window.open(url, "_blank");

  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

