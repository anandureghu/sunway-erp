// src/lib/utils.ts
import type { Role } from "@/types/hr";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn's recommended cn helper */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function formatDate(date: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
}

export function formatMoney(
  amount: string | number,
  currencySymbol: string = "$",
) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${currencySymbol}${num.toLocaleString("en-US")}`;
}

export const toISO = (date: string) => new Date(date).toISOString();

export const getParentPath = (pathname: string) =>
  pathname.includes("finance")
    ? "finance"
    : pathname.includes("inventory")
      ? "inventory"
      : "admin";

export const hasAnyRole = (
  userRole: Role | undefined,
  allowedRoles: Role[],
): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};
