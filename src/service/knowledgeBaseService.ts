import { apiClient } from "@/service/apiClient";
import type { KnowledgeBaseItem } from "@/types/knowledge-base";

export const KNOWLEDGE_BASE_UPDATED_EVENT = "sunway:knowledge-base-updated";

export function notifyKnowledgeBaseUpdated() {
  window.dispatchEvent(new Event(KNOWLEDGE_BASE_UPDATED_EVENT));
}

export async function listKnowledgeBaseItems(): Promise<KnowledgeBaseItem[]> {
  const res = await apiClient.get<KnowledgeBaseItem[]>("/knowledge-base");
  return res.data;
}

export async function getKnowledgeBaseItem(
  id: number,
): Promise<KnowledgeBaseItem> {
  const res = await apiClient.get<KnowledgeBaseItem>(`/knowledge-base/${id}`);
  return res.data;
}

export async function uploadKnowledgeBaseItem(params: {
  title: string;
  description?: string;
  file: File;
}): Promise<KnowledgeBaseItem> {
  const form = new FormData();
  form.append("title", params.title);
  if (params.description?.trim()) {
    form.append("description", params.description.trim());
  }
  form.append("file", params.file);
  const res = await apiClient.post<KnowledgeBaseItem>("/knowledge-base", form);
  notifyKnowledgeBaseUpdated();
  return res.data;
}

export async function deleteKnowledgeBaseItem(id: number): Promise<void> {
  await apiClient.delete(`/knowledge-base/${id}`);
  notifyKnowledgeBaseUpdated();
}
