export interface Customer {
  id: number;
  name: string | null;
  customerId: number | null;
  customerName?: string; // For form submission
  taxId?: string;
  paymentTerms?: string;
  currencyCode?: string;
  creditLimit?: number;
  street: string;
  city: string;
  state?: string;
  country: string;
  phoneNo: string;
  email?: string;
  contactPersonName?: string;
  websiteUrl?: string;
  customerType?: string;
  companyId?: number;
  active?: boolean;
  isActive?: boolean; // For form submission
  createdAt?: string | null;
  createdBy?: string;
}

