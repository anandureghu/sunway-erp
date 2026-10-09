export type KnowledgeBaseContentType = "VIDEO" | "DOCUMENT";

export type KnowledgeBaseItem = {
  id: number;
  title: string;
  description: string | null;
  contentType: KnowledgeBaseContentType;
  fileName: string;
  contentTypeMime: string | null;
  sizeBytes: number;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
};
