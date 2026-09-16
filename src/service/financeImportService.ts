import { apiClient } from "./apiClient";

export type FinanceCsvPreview = {
  headers: string[];
  fieldMapping: Record<string, string | null>;
  aiMapped: boolean;
  dataRowCount: number;
  sampleRows: Record<string, string>[];
  warnings: string[];
};

export type CoaCsvImportResult = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: { row: number; code?: string | null; message: string }[];
};

export type TransactionCsvImportResult = {
  created: number;
  skipped: number;
  failed: number;
  errors: { row: number; message: string }[];
};

// ── Chart of Accounts ──────────────────────────────────────────────────────

export const COA_CSV_CANONICAL_FIELDS = [
  "accountCode",
  "accountName",
  "type",
  "description",
  "parentAccountCode",
  "departmentName",
  "projectCode",
  "openingBalance",
  "accountNo",
];

export async function previewCoaCsv(file: File): Promise<FinanceCsvPreview> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<FinanceCsvPreview>(
    "/finance/chart-of-accounts/import-csv/preview",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function importCoaCsv(
  file: File,
  mapping?: Record<string, string | null>,
): Promise<CoaCsvImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (mapping) formData.append("mapping", JSON.stringify(mapping));
  const res = await apiClient.post<CoaCsvImportResult>(
    "/finance/chart-of-accounts/import-csv",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

// ── Transactions ───────────────────────────────────────────────────────────

export const TRANSACTION_CSV_CANONICAL_FIELDS = [
  "transactionDate",
  "transactionType",
  "amount",
  "debitAccountCode",
  "creditAccountCode",
  "transactionDescription",
  "source",
];

export async function previewTransactionCsv(
  file: File,
): Promise<FinanceCsvPreview> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<FinanceCsvPreview>(
    "/finance/transactions/import-csv/preview",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function importTransactionCsv(
  file: File,
  mapping?: Record<string, string | null>,
): Promise<TransactionCsvImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (mapping) formData.append("mapping", JSON.stringify(mapping));
  const res = await apiClient.post<TransactionCsvImportResult>(
    "/finance/transactions/import-csv",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}
