import { apiClient } from "@/service/apiClient";
import type { PlatformSettings, PlatformSettingsRequest } from "@/types/platform";

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const res = await apiClient.get<PlatformSettings>("/admin/platform-settings");
  return res.data;
}

export async function updatePlatformSettings(
  body: PlatformSettingsRequest,
): Promise<PlatformSettings> {
  const res = await apiClient.put<PlatformSettings>("/admin/platform-settings", body);
  return res.data;
}
