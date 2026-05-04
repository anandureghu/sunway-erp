import type { Vendor } from "@/types/vendor";
import type { VendorFormData } from "@/schema/vendor";

/** Raw vendor JSON from Spring (camelCase + occasional snake_case). */
type VendorApiRecord = Record<string, unknown> & {
  id?: number;
  vendorName?: string;
  isActive?: boolean;
  active?: boolean;
  is1099Vendor?: boolean;
  is_1099_vendor?: boolean;
  creditLimit?: number | string | null;
  remarks?: string | null;
};

/**
 * Maps API vendor JSON to the shape used in the app (UI uses `active`; API uses `isActive`).
 */
export function normalizeVendorFromApi(raw: unknown): Vendor {
  const r = raw as VendorApiRecord;
  const active =
    r.active !== undefined
      ? Boolean(r.active)
      : r.isActive !== undefined
        ? Boolean(r.isActive)
        : true;

  const is1099 =
    r.is1099Vendor !== undefined
      ? Boolean(r.is1099Vendor)
      : r.is_1099_vendor !== undefined
        ? Boolean(r.is_1099_vendor)
        : false;

  const creditRaw = r.creditLimit;
  const creditLimit =
    creditRaw === null || creditRaw === undefined
      ? 0
      : typeof creditRaw === "number"
        ? creditRaw
        : Number(creditRaw);

  return {
    id: Number(r.id),
    vendorName: String(r.vendorName ?? ""),
    taxId: r.taxId != null ? String(r.taxId) : undefined,
    paymentTerms: r.paymentTerms != null ? String(r.paymentTerms) : undefined,
    currencyCode: r.currencyCode != null ? String(r.currencyCode) : undefined,
    creditLimit: Number.isFinite(creditLimit) ? creditLimit : 0,
    street: r.street != null ? String(r.street) : undefined,
    city: r.city != null ? String(r.city) : undefined,
    country: r.country != null ? String(r.country) : undefined,
    phoneNo: r.phoneNo != null ? String(r.phoneNo) : undefined,
    email: r.email != null ? String(r.email) : undefined,
    contactPersonName:
      r.contactPersonName != null ? String(r.contactPersonName) : undefined,
    fax: r.fax != null ? String(r.fax) : undefined,
    websiteUrl: r.websiteUrl != null ? String(r.websiteUrl) : undefined,
    remarks: r.remarks != null ? String(r.remarks) : undefined,
    active,
    is1099Vendor: is1099,
    approved: Boolean(r.approved),
    rejected: Boolean(r.rejected),
    createdAt:
      r.createdAt != null
        ? String(r.createdAt)
        : r.created_at != null
          ? String(r.created_at)
          : undefined,
    createdBy:
      r.createdBy != null
        ? String(r.createdBy)
        : r.created_by != null
          ? String(r.created_by)
          : undefined,
  };
}

/** Stable form defaults for react-hook-form when editing a supplier. */
export function vendorToFormDefaults(vendor: Vendor): Partial<VendorFormData> {
  const v = normalizeVendorFromApi(vendor);
  return {
    vendorName: v.vendorName,
    taxId: v.taxId ?? "",
    paymentTerms: v.paymentTerms ?? "",
    currencyCode: v.currencyCode ?? "",
    creditLimit: v.creditLimit ?? 0,
    active: v.active ?? true,
    street: v.street ?? "",
    city: v.city ?? "",
    country: v.country ?? "",
    phoneNo: v.phoneNo ?? "",
    email: v.email ?? "",
    contactPersonName: v.contactPersonName ?? "",
    fax: v.fax ?? "",
    websiteUrl: v.websiteUrl ?? "",
    is1099Vendor: Boolean(v.is1099Vendor),
    remarks: v.remarks ?? "",
  };
}

/**
 * Body for POST `/api/vendors` and PUT `/api/vendors/{id}` — Spring expects `isActive`, not `active`.
 */
export function vendorFormToApiPayload(
  data: VendorFormData,
): Record<string, unknown> {
  return {
    vendorName: data.vendorName,
    taxId: data.taxId?.trim() || null,
    paymentTerms: data.paymentTerms?.trim() || null,
    currencyCode: data.currencyCode?.trim() || null,
    creditLimit: data.creditLimit ?? 0,
    isActive: data.active ?? true,
    is1099Vendor: data.is1099Vendor ?? false,
    street: data.street?.trim() || null,
    city: data.city?.trim() || null,
    country: data.country?.trim() || null,
    phoneNo: data.phoneNo?.trim() || null,
    email: data.email?.trim() || null,
    contactPersonName: data.contactPersonName?.trim() || null,
    fax: data.fax?.trim() || null,
    websiteUrl: data.websiteUrl?.trim() || null,
    remarks: data.remarks?.trim() || null,
  };
}
