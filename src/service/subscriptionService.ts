import { apiClient } from "@/service/apiClient";
import type {
  AssignSubscriptionRequest,
  CancelSubscriptionRequest,
  CompanySubscription,
  ExtendSubscriptionRequest,
  PagedSubscriptions,
  RecordSubscriptionPaymentRequest,
  SubscriptionAnalytics,
  SubscriptionInvoice,
  SubscriptionPaymentStatus,
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

export async function fetchMySubscription(): Promise<CompanySubscription> {
  const res = await apiClient.get<CompanySubscription>("/subscriptions/me");
  return res.data;
}

export async function fetchSubscriptions(params: {
  status?: SubscriptionStatus | "";
  planType?: SubscriptionPlanType | "";
  companyId?: number;
  expiringWithinDays?: number;
  paymentStatus?: SubscriptionPaymentStatus | "";
  page?: number;
  size?: number;
}): Promise<PagedSubscriptions> {
  const res = await apiClient.get<PagedSubscriptions>("/admin/subscriptions", {
    params: {
      status: params.status || undefined,
      planType: params.planType || undefined,
      companyId: params.companyId,
      expiringWithinDays: params.expiringWithinDays,
      paymentStatus: params.paymentStatus || undefined,
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

export async function generateSubscriptionInvoice(
  companyId: number,
): Promise<SubscriptionInvoice> {
  const res = await apiClient.post<SubscriptionInvoice>(
    `/admin/subscriptions/${companyId}/invoices/generate`,
  );
  return res.data;
}

export async function regenerateSubscriptionInvoice(
  companyId: number,
): Promise<SubscriptionInvoice> {
  const res = await apiClient.post<SubscriptionInvoice>(
    `/admin/subscriptions/${companyId}/invoices/regenerate`,
  );
  return res.data;
}

export async function sendSubscriptionInvoice(
  companyId: number,
  resend = false,
): Promise<SubscriptionInvoice> {
  const res = await apiClient.post<SubscriptionInvoice>(
    `/admin/subscriptions/${companyId}/invoices/send`,
    null,
    { params: { resend } },
  );
  return res.data;
}

export async function downloadSubscriptionInvoicePdf(
  companyId: number,
  invoiceId: number,
): Promise<Blob> {
  const res = await apiClient.get(
    `/admin/subscriptions/${companyId}/invoices/${invoiceId}/pdf`,
    { responseType: "blob" },
  );
  return res.data as Blob;
}

export async function downloadMySubscriptionInvoicePdf(
  invoiceId: number,
): Promise<Blob> {
  const res = await apiClient.get(
    `/subscriptions/me/invoices/${invoiceId}/pdf`,
    { responseType: "blob" },
  );
  return res.data as Blob;
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

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function openBlobPreview(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
