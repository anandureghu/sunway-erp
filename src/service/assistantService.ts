import { apiClient } from "@/service/apiClient";

export type AssistantRole = "user" | "assistant";

export type AssistantMessagePayload = {
  role: AssistantRole;
  content: string;
};

export type AssistantToolCall = {
  name: string;
  argumentsJson?: string;
  status?: string;
};

export type AssistantLink = {
  label: string;
  url: string;
  type?: string;
};

export type AssistantChatRequest = {
  conversationId?: string;
  message: string;
  currentModule?: string;
  currentScreen?: string;
  pageContext?: Record<string, unknown>;
  history?: AssistantMessagePayload[];
};

export type AssistantChatResponse = {
  conversationId: string;
  message: string;
  model?: string;
  configured: boolean;
  error?: string;
  toolCalls?: AssistantToolCall[];
  links?: AssistantLink[];
};

export async function sendAssistantMessage(
  payload: AssistantChatRequest,
): Promise<AssistantChatResponse> {
  const response = await apiClient.post<AssistantChatResponse>(
    "/assistant/chat",
    payload,
  );
  return response.data;
}
