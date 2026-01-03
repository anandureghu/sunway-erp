import type { ColumnDef } from "@tanstack/react-table";

export interface JournalLineCreateDTO {
  debitAccount: number | null;
  creditAccount: number | null;
  debitAmount: number | null;
  creditAmount: number | null;
  departmentId?: number | null;
  projectId?: number | null;
  currencyCode?: string | null;
  exchangeRate?: number | null;
  description?: string | null;
}

export interface JournalEntryCreateDTO {
  description?: string | null;
  entryDate: string; // YYYY-MM-DD
  source: string; // "MANUAL"
  periodId: number;
  lines: JournalLineCreateDTO[];
  status?: JournalStatus;
}

export interface JournalEntryUpdateDTO {
  description?: string | null;
  entryDate: string;
  periodId: number;
  lines: JournalLineCreateDTO[];
  status?: JournalStatus;
}

// --------------------------------------------
// JOURNAL LINE (returned from backend)
// --------------------------------------------
export interface JournalLineDTO {
  id: number;
  debitAccount: number | null;
  creditAccount: number | null;
  debitAmount: number | null;
  creditAmount: number | null;
  departmentId: number | null;
  projectId: number | null;
  currencyCode: string | null;
  exchangeRate: number | null;
  description: string | null;
}

// --------------------------------------------
// JOURNAL ENTRY RESPONSE DTO (returned from backend)
// --------------------------------------------
export interface JournalEntryResponseDTO {
  id: number;
  journalEntryNumber: string;
  entryDate: string; // ISO date string from backend
  source: string; // e.g., "MANUAL", "AP", "AR"
  status: JournalStatus;
  periodId: number;

  description: string | null;

  totalDebit: number;
  totalCredit: number;

  postedAt: string | null;
  reversedAt: string | null;
  reversalEntryId: number | null;

  // All journal lines
  lines: JournalLineDTO[];
}

export type JournalColumnsType = ColumnDef<JournalEntryResponseDTO>[];

export const JOURNAL_STATUS = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  POSTED: "POSTED",
  REVERSED: "REVERSED",
} as const;

export type JournalStatus = keyof typeof JOURNAL_STATUS;
