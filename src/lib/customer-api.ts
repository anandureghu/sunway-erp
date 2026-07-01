import type { Customer } from "@/types/customer";

export function isCustomerActive(customer: Customer): boolean {
  if (customer.isActive === false || customer.active === false) return false;
  return true;
}

export function normalizeCustomerFromApi(raw: Record<string, unknown>): Customer {
  const isActive =
    raw.isActive !== undefined
      ? Boolean(raw.isActive)
      : raw.active !== undefined
        ? Boolean(raw.active)
        : true;

  return {
    ...(raw as unknown as Customer),
    name: (raw.customerName as string) ?? (raw.name as string) ?? null,
    customerName: (raw.customerName as string) ?? (raw.name as string),
    isActive,
    active: isActive,
    country: (raw.country as string) ?? "",
  };
}

export function formatCustomerCode(id: number | string | null | undefined): string {
  if (id == null || id === "") return "—";
  const numeric = Number(id);
  if (Number.isNaN(numeric)) return String(id);
  return `CUST-${String(numeric).padStart(5, "0")}`;
}
