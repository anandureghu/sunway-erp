// src/types/finance/reconciliation.ts

export type ReconciliationStatus = "DRAFT" | "CONFIRMED";

export interface Reconciliation {
  id: number;

  accountId: number;
  accountName: string;
  accountCode: string;

  amount: number;
  initialBalance: number;
  newBalance: number;

  resource: string | null;
  reason: string | null;

  status: ReconciliationStatus;

  createdAt: string;
  confirmedAt: string | null;

  createdByName: string | null;
  confirmedByName: string | null;
}
