export interface Vendor {
  id: number;
  vendorCode?: string;
  vendorName: string;
  taxId?: string;
  categoryId?: number | null;
  categoryName?: string | null;
  vendorCrNo?: string;
  bankName?: string;
  iban?: string;
  paymentTerms?: string;
  currencyCode?: string;
  creditLimit?: number;
  street?: string;
  city?: string;
  country?: string;
  phoneNo?: string;
  email?: string;
  contactPersonName?: string;
  fax?: string;
  websiteUrl?: string;
  remarks?: string;
  active?: boolean;
  is1099Vendor?: boolean;
  createdAt?: string | null;
  createdBy?: string;
  approved: boolean;
  rejected: boolean;
}
