import { apiClient } from "./apiClient";

export interface DependentPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: string;
  nationality?: string;
  nationalId?: string;
  maritalStatus?: string;
  relationship?: string;
  phoneNo?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  emergencyContact?: boolean;
}

/**
 * Backend DTO (DependentRequestDTO / DependentResponseDTO) names the contact fields
 * phoneNumber / addressLine1 / addressLine2, while the UI uses phoneNo / address /
 * address2. Translate both ways here — sending the UI names made the backend
 * silently drop the phone number and address on every save.
 */
type DependentApi = Omit<DependentPayload, "phoneNo" | "address" | "address2"> & {
  id?: number;
  employeeId?: number;
  phoneNumber?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
};

function toApi(payload: DependentPayload): DependentApi {
  const { phoneNo, address, address2, ...rest } = payload;
  return {
    ...rest,
    phoneNumber: phoneNo,
    addressLine1: address,
    addressLine2: address2,
  };
}

function fromApi(api: DependentApi): DependentPayload & { id?: number; employeeId?: number } {
  const { phoneNumber, addressLine1, addressLine2, ...rest } = api;
  return {
    ...rest,
    phoneNo: phoneNumber ?? undefined,
    address: addressLine1 ?? undefined,
    address2: addressLine2 ?? undefined,
  };
}

async function getAll(employeeId: number) {
  const res = await apiClient.get<DependentApi[]>(`/employees/${employeeId}/dependents`);
  return (Array.isArray(res.data) ? res.data : []).map(fromApi);
}

async function create(employeeId: number, payload: DependentPayload) {
  const res = await apiClient.post<DependentApi>(`/employees/${employeeId}/dependents`, toApi(payload));
  return fromApi(res.data);
}

async function update(employeeId: number, dependentId: number, payload: DependentPayload) {
  const res = await apiClient.put<DependentApi>(
    `/employees/${employeeId}/dependents/${dependentId}`,
    toApi(payload),
  );
  return fromApi(res.data);
}

async function remove(employeeId: number, dependentId: number) {
  await apiClient.delete(`/employees/${employeeId}/dependents/${dependentId}`);
}

// Helper to extract backend message (UI code can call this)
function extractErrorMessage(err: any): string {
  return err?.response?.data?.message || err?.response?.data?.error || err?.message || String(err);
}

export const dependentService = {
  getAll,
  create,
  update,
  remove,
  extractErrorMessage,
};

export default dependentService;
