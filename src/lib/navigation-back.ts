export type BackNavigationState = {
  backTo?: string;
};

/** Prefer explicit return path from router state; otherwise use the page default. */
export function resolveBackHref(
  locationState: unknown,
  fallback: string,
): string {
  const backTo = (locationState as BackNavigationState | null)?.backTo;
  if (typeof backTo === "string" && backTo.startsWith("/")) {
    return backTo;
  }
  return fallback;
}

export function resolveCustomerListPath(pathname: string): string {
  if (pathname.includes("/inventory/sales/customers")) {
    return "/inventory/sales/customers";
  }
  if (pathname.includes("/finance/customers")) {
    return "/finance/receivable";
  }
  return "/admin/customers";
}

export function resolveVendorListPath(pathname: string): string {
  if (pathname.includes("/inventory/purchase/suppliers")) {
    return "/inventory/purchase/suppliers";
  }
  if (pathname.includes("/finance/vendors")) {
    return "/finance/payable";
  }
  return "/admin/vendors";
}
