export interface Company {
  id: number;
  companyName: string;
  noOfEmployees: number; // number of employees
  crNo: number; // company number
  computerCard: string;
  street: string;
  city: string;
  state: string;
  country: string;
  phoneNo: string;
  createdAt: string;
  createdBy: string;
  hrEnabled: boolean;
  financeEnabled: boolean;
  inventoryEnabled: boolean;
}
