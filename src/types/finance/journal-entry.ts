// src/types/finance/journal-entry.ts

export type JournalEntryStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "ON_HOLD";

export interface JournalEntry {
  id: number;
  jeNumber: string;

  creditAccountId: number;
  creditAccountName: string;
  creditAccountCode: string;

  debitAccountId: number;
  debitAccountName: string;
  debitAccountCode: string;

  amount: number;
  source: string | null;
  description: string | null;

  status: JournalEntryStatus;

  createdAt: string;
  approvedAt: string | null;

  createdByName: string | null;
  approvedByName: string | null;
}
