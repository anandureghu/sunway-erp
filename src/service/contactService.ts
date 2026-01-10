import { apiClient } from "@/service/apiClient";

export interface ContactInfoPayload {
  email: string;
  phone: string;
  altPhone?: string;
  notes: string;
}

const BASE = "/employees";

// named exports for backwards compatibility with existing call sites
export function getContactInfo(employeeId: number) {
  return apiClient.get<ContactInfoPayload>(`${BASE}/${employeeId}/contact-info`);
}

export function saveContactInfo(employeeId: number, payload: ContactInfoPayload) {
  if (!payload || !payload.email) {
    return Promise.reject(new Error("email is required"));
  }
  if (!payload.notes) {
    return Promise.reject(new Error("notes is required"));
  }
  return apiClient.put<ContactInfoPayload>(`${BASE}/${employeeId}/contact-info`, payload);
}

// default object for import compatibility
export const contactService = {
  getContactInfo,
  saveContactInfo,
};

export default contactService;
