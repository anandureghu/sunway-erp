export interface Vendor {
  id: number;
  vendorName: string;
  taxId?: string;
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
  active?: boolean;
  is1099Vendor?: boolean;
  createdAt?: string | null;
  createdBy?: string;
}

