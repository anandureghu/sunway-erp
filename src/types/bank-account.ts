export interface BankAccount {
  id: number;
  companyId: number;
  bankName: string;
  accountNumber: string;
  ifscCode?: string;
  branchName?: string;
  accountHolderName: string;
  primaryAccount: boolean;
}
