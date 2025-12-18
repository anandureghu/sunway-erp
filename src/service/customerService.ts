import { apiClient } from "@/service/apiClient";
import type { Customer } from "@/types/sales";
import type { CustomerResponseDTO } from "@/service/erpApiTypes";

function toCustomer(dto: CustomerResponseDTO): Customer {
  return {
    id: String(dto.id),
    code: `CUST-${dto.id}`,
    name: dto.customerName || "",
    contactPerson: dto.contactPersonName,
    email: dto.email,
    phone: dto.phoneNo,
    address: dto.street,
    city: dto.city,
    state: dto.state,
    country: dto.country,
    postalCode: undefined,
    taxId: dto.taxId,
    creditLimit: dto.creditLimit,
    paymentTerms: dto.paymentTerms,
    status: dto.active === false ? "inactive" : "active",
    createdAt: "",
    updatedAt: "",
  };
}

export async function listCustomers(): Promise<Customer[]> {
  const res = await apiClient.get<CustomerResponseDTO[]>("/customers");
  return (res.data || []).map(toCustomer);
}


