import type { PurchaseOrder, Supplier } from "@/types/purchase";
import type { Vendor } from "@/types/vendor";

/** Map API vendor row to legacy Supplier shape used by purchase tables. */
export function vendorToSupplier(vendor: Vendor): Supplier {
  return {
    id: String(vendor.id),
    code: String(vendor.id),
    name: vendor.vendorName || "Unknown Supplier",
    contactPerson: vendor.contactPersonName,
    email: vendor.email,
    phone: vendor.phoneNo,
    status: vendor.active ? "active" : "inactive",
    createdAt: "",
  };
}

export function enrichPurchaseOrdersWithVendors(
  orders: PurchaseOrder[],
  vendors: Vendor[],
): PurchaseOrder[] {
  return orders.map((order) => {
    const vendor = vendors.find((v) => String(v.id) === order.supplierId);
    return {
      ...order,
      supplier: vendor ? vendorToSupplier(vendor) : undefined,
    };
  });
}
