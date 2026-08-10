import { apiClient } from "@/service/apiClient";
import type {
  AssignSubscriptionRequest,
  CancelSubscriptionRequest,
  CompanySubscription,
  ExtendSubscriptionRequest,
  PagedSubscriptions,
  RecordSubscriptionPaymentRequest,
  SubscriptionAnalytics,
  SubscriptionPlanType,
  SubscriptionStatus,
  SubscriptionStatusResponse,
} from "@/types/subscription";

export async function fetchMySubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  const res = await apiClient.get<SubscriptionStatusResponse>(
    "/admin/subscriptions/me/status",
  );
  return res.data;
}

export async function fetchSubscriptions(params: {
  status?: SubscriptionStatus | "";
  planType?: SubscriptionPlanType | "";
  companyId?: number;
  expiringWithinDays?: number;
  page?: number;
  size?: number;
}): Promise<PagedSubscriptions> {
  const res = await apiClient.get<PagedSubscriptions>("/admin/subscriptions", {
    params: {
      status: params.status || undefined,
      planType: params.planType || undefined,
      companyId: params.companyId,
      expiringWithinDays: params.expiringWithinDays,
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
  return res.data;
}

export async function fetchSubscription(
  companyId: number,
): Promise<CompanySubscription> {
  const res = await apiClient.get<CompanySubscription>(
    `/admin/subscriptions/${companyId}`,
  );
  return res.data;
}

export async function assignSubscription(
  companyId: number,
  body: AssignSubscriptionRequest,
): Promise<CompanySubscription> {
  const res = await apiClient.put<CompanySubscription>(
    `/admin/subscriptions/${companyId}`,
    body,
  );
  return res.data;
}

export async function recordSubscriptionPayment(
  companyId: number,
  body: RecordSubscriptionPaymentRequest,
): Promise<CompanySubscription> {
  const res = await apiClient.post<CompanySubscription>(
    `/admin/subscriptions/${companyId}/payments`,
    body,
  );
  return res.data;
}

export async function extendSubscription(
  companyId: number,
  body: ExtendSubscriptionRequest,
): Promise<CompanySubscription> {
  const res = await apiClient.post<CompanySubscription>(
    `/admin/subscriptions/${companyId}/extend`,
    body,
  );
  return res.data;
}

export async function cancelSubscription(
  companyId: number,
  body?: CancelSubscriptionRequest,
): Promise<CompanySubscription> {
  const res = await apiClient.post<CompanySubscription>(
    `/admin/subscriptions/${companyId}/cancel`,
    body ?? {},
  );
  return res.data;
}

export async function fetchSubscriptionAnalytics(params?: {
  from?: string;
  to?: string;
}): Promise<SubscriptionAnalytics> {
  const res = await apiClient.get<SubscriptionAnalytics>(
    "/admin/subscriptions/analytics",
    { params },
  );
  return res.data;
}
