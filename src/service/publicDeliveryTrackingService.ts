import { apiClient } from "@/service/apiClient";
import type {
  PublicDeliveryTrackingCompany,
  PublicDeliveryTrackingLookupRequest,
  PublicDeliveryTrackingLookupResponse,
} from "@/types/public-delivery-tracking";

export async function getPublicDeliveryTrackingCompany(
  companyCode: string,
): Promise<PublicDeliveryTrackingCompany> {
  const response = await apiClient.get<PublicDeliveryTrackingCompany>(
    `/public/deliveries/${encodeURIComponent(companyCode)}`,
  );
  return response.data;
}

export async function lookupPublicDeliveries(
  companyCode: string,
  request: PublicDeliveryTrackingLookupRequest,
): Promise<PublicDeliveryTrackingLookupResponse> {
  const response = await apiClient.post<PublicDeliveryTrackingLookupResponse>(
    `/public/deliveries/${encodeURIComponent(companyCode)}/lookup`,
    request,
  );
  return response.data;
}

export function buildPublicDeliveryTrackingUrl(
  companyCode: string,
  options?: { orderNumber?: string },
): string {
  const code = companyCode.trim();
  const base = `${window.location.origin}/public/track/${encodeURIComponent(code)}`;
  const orderNumber = options?.orderNumber?.trim();
  if (!orderNumber) {
    return base;
  }
  return `${base}?orderNumber=${encodeURIComponent(orderNumber)}`;
}
