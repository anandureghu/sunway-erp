export interface TransactionResponseDTO {
  id: number;
  transactionCode: string | null;
  transactionType: string | null;

  transactionDate: string;

  amount: number | string;

  debitAccountId?: number | null;
  debitAccountName?: string | null;
  creditAccountId?: number | null;
  creditAccountName?: string | null;

  companyId?: number;
  companyName?: string | null;

  invoiceId?: string | null;
  paymentId?: string | null;

  transactionDescription?: string | null;

  relatedId?: number | null;
  relatedSubId?: number | null;

  /** UNKNOWN until user sets a concrete value (one-time). */
  source?: string | null;
  sourceLocked?: boolean;
}

export interface CreateTransactionDTO {
  companyId: number;
  transactionType: string;
  transactionDate: string;
  amount: number | string;
  /** Omit or 0 for single-sided debit-only / credit-only. */
  debitAccount?: number;
  creditAccount?: number;
  invoiceId?: string | null;
  paymentId?: string | null;
  transactionDescription?: string | null;
  source?: string | null;
}

export interface UpdateTransactionDTO {
  transactionType?: string;
  transactionDate?: string;
  amount?: number | string;
  transactionDescription?: string | null;
}
