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
  currency?: Currency;
}

export type IModules = "hr" | "finance" | "inventory";

import type { LucideIcon } from "lucide-react";
import type { Currency } from "./currency";

export interface SidebarSubItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface SidebarItem {
  title: string;
  icon: LucideIcon;
  color: string;
  image: string;
  url: string;
  items: SidebarSubItem[];
}
