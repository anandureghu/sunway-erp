import { apiClient } from "@/service/apiClient";
import type { Vendor } from "@/types/vendor";

function toVendor(dto: any): Vendor {
  return {
    id: dto.id,
    vendorName: dto.vendorName || "",
    taxId: dto.taxId,
    paymentTerms: dto.paymentTerms,
    currencyCode: dto.currencyCode,
    creditLimit: dto.creditLimit,
    street: dto.street,
    city: dto.city,
    country: dto.country,
    phoneNo: dto.phoneNo,
    email: dto.email,
    contactPersonName: dto.contactPersonName,
    fax: dto.fax,
    websiteUrl: dto.websiteUrl,
    active: dto.active !== undefined ? dto.active : true,
    is1099Vendor: dto.is1099Vendor !== undefined ? dto.is1099Vendor : 
                 dto.is_1099_vendor !== undefined ? dto.is_1099_vendor :
                 dto.is1099 !== undefined ? dto.is1099 : false,
    createdAt: dto.createdAt || dto.created_at || dto.dateCreated || dto.date_created || null,
    createdBy: dto.createdBy,
  };
}

export async function listVendors(): Promise<Vendor[]> {
  const res = await apiClient.get<any[]>("/vendors");
  return (res.data || []).map(toVendor);
}

