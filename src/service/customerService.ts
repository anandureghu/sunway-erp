import { apiClient } from "@/service/apiClient";
import type { Customer } from "@/types/sales";
import type { CustomerResponseDTO } from "@/service/erpApiTypes";
import type { PageResult } from "@/types/page";
import { normalizePageResult } from "@/types/page";
import { normalizeCustomerFromApi } from "@/lib/customer-api";
import type { Customer as AdminCustomer } from "@/types/customer";

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

export async function listCustomersPaged(params: {
  page: number;
  size: number;
  search?: string;
  status?: string;
  country?: string;
  city?: string;
  customerType?: string;
  phone?: string;
  code?: string;
}): Promise<PageResult<AdminCustomer>> {
  const res = await apiClient.get<PageResult<Record<string, unknown>>>(
    "/customers",
    {
      params: {
        page: params.page,
        size: params.size,
        search: params.search || undefined,
        status:
          params.status && params.status !== "all" ? params.status : undefined,
        country:
          params.country && params.country !== "all"
            ? params.country
            : undefined,
        city: params.city && params.city !== "all" ? params.city : undefined,
        customerType:
          params.customerType && params.customerType !== "all"
            ? params.customerType
            : undefined,
        phone: params.phone || undefined,
        code: params.code || undefined,
      },
    },
  );
  const page = normalizePageResult(res.data);
  return {
    ...page,
    content: (page.content || []).map((row) =>
      normalizeCustomerFromApi(row as Record<string, unknown>),
    ),
  };
}


