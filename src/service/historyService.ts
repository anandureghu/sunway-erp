import { apiClient } from "@/service/apiClient";
import type {
  BulkActionResult,
  HistoryEntityType,
  HistoryModule,
  HistoryPageResponse,
} from "@/types/history";

export async function listHistoryRecords(params: {
  module: HistoryModule;
  type: HistoryEntityType;
  page?: number;
  size?: number;
  search?: string;
}): Promise<HistoryPageResponse> {
  const response = await apiClient.get<HistoryPageResponse>("/history", {
    params: {
      module: params.module.toUpperCase(),
      type: params.type,
      page: params.page ?? 0,
      size: params.size ?? 20,
      search: params.search || undefined,
    },
  });
  return response.data;
}

export async function bulkArchiveHistoryRecords(
  type: HistoryEntityType,
  ids: number[],
): Promise<BulkActionResult> {
  const response = await apiClient.post<BulkActionResult>("/history/bulk-archive", {
    type,
    ids,
  });
  return response.data;
}

export async function bulkDeleteHistoryRecords(
  type: HistoryEntityType,
  ids: number[],
): Promise<BulkActionResult> {
  const response = await apiClient.post<BulkActionResult>("/history/bulk-delete", {
    type,
    ids,
  });
  return response.data;
}

export async function deleteAllHistoryRecords(
  type: HistoryEntityType,
  confirmToken: string,
): Promise<BulkActionResult> {
  const response = await apiClient.post<BulkActionResult>("/history/delete-all", {
    type,
    confirmToken,
  });
  return response.data;
}

export function summarizeBulkActionResult(result: BulkActionResult): string {
  const successCount = result.succeeded?.length ?? 0;
  const failCount = result.failed?.length ?? 0;
  if (successCount > 0 && failCount === 0) {
    return `${successCount} record${successCount === 1 ? "" : "s"} processed successfully.`;
  }
  if (successCount > 0 && failCount > 0) {
    return `${successCount} succeeded, ${failCount} failed.`;
  }
  if (failCount > 0) {
    return result.failed[0]?.reason || `${failCount} record(s) failed.`;
  }
  return "No records processed.";
}
