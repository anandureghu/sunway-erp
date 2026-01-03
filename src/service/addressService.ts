import { apiClient } from "./apiClient";

export interface Address {
  id?: number;
  employeeId?: number;

  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;

  // allow expected backend types
  addressType?: "CURRENT" | "PERMANENT" | "OFFICE" | "HOME" | "OTHER";
  primaryAddress?: boolean;
}

/**
 * Get all addresses of an employee
 */
async function getAddressesByEmployee(employeeId: number): Promise<Address[]> {
  const res = await apiClient.get<Address[]>(
    `/employees/${employeeId}/addresses`
  );
  return res.data;
}

/**
 * Add new address for an employee
 */
async function addAddress(
  employeeId: number,
  payload: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    addressType?: "CURRENT" | "PERMANENT" | "OFFICE" | "HOME" | "OTHER";
    primaryAddress?: boolean;
  }
): Promise<Address> {
  const res = await apiClient.post<Address>(
    `/employees/${employeeId}/addresses`,
    payload
  );
  return res.data;
}

/**
 * Update existing address
 */
async function updateAddress(
  addressId: number,
  payload: Partial<{
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    addressType?: "CURRENT" | "PERMANENT" | "OFFICE" | "HOME" | "OTHER";
    primaryAddress?: boolean;
  }>
): Promise<Address> {
  const res = await apiClient.put<Address>(
    `/addresses/${addressId}`,
    payload
  );
  return res.data;
}

/**
 * Delete address
 */
async function deleteAddress(addressId: number): Promise<void> {
  await apiClient.delete(`/addresses/${addressId}`);
}

export const addressService = {
  getAddressesByEmployee,
  addAddress,
  updateAddress,
  deleteAddress,
};

export default addressService;
