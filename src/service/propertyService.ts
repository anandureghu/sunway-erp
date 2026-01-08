import { apiClient } from "@/service/apiClient";

export type CompanyPropertyPayload = {
  itemCode: string;
  itemName: string;
  itemStatus: "ASSIGNED" | "RETURNED" | "LOST" | "DAMAGED";
  description: string;
  dateGiven: string;
  returnDate?: string | null;
};

export type CompanyPropertyResponse = CompanyPropertyPayload & {
  id: number;
};

const BASE = "/employees";

export const propertyService = {
  getAll(employeeId: number) {
    return apiClient.get<CompanyPropertyResponse[]>(
      `${BASE}/${employeeId}/company-properties`
    );
  },

  create(employeeId: number, payload: CompanyPropertyPayload) {
    return apiClient.post<CompanyPropertyResponse>(
      `${BASE}/${employeeId}/company-properties`,
      payload
    );
  },

  update(
    employeeId: number,
    propertyId: number,
    payload: CompanyPropertyPayload
  ) {
    return apiClient.put<CompanyPropertyResponse>(
      `${BASE}/${employeeId}/company-properties/${propertyId}`,
      payload
    );
  }
  ,
  delete(employeeId: number, propertyId: number) {
    return apiClient.delete<void>(
      `${BASE}/${employeeId}/company-properties/${propertyId}`
    );
  }
};

export default propertyService;
