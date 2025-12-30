export interface TransactionResponseDTO {
  id: number;
  transactionCode: string | null;
  transactionType: string | null;
  fiscalType: string | null;

  transactionDate: string;
  postedDate: string | null;
  posted: boolean;

  amount: number | string;

  debitAccount: string | null;
  creditAccount: string | null;

  companyId: number;
  companyName: string | null;

  itemCode: string | null;
  invoiceId: string | null;
  paymentId: string | null;

  transactionDescription: string | null;
}

export interface CreateTransactionDTO {
  companyId: number;
  transactionType: string;
  // fiscalType: string;
  transactionDate: string;
  amount: number | string;
  debitAccount: number;
  creditAccount: number;
  // itemCode?: string | null;
  invoiceId?: string | null;
  paymentId?: string | null;
  transactionDescription?: string | null;
}
