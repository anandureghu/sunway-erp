/** Normalized page payload from Spring `Page`, `PageResponse`, or `PagedResponse`. */
export type PageResult<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  /** 0-based page index (`PageResponse.page` or Spring `number`). */
  page?: number;
  size?: number;
  number?: number;
};

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_SEARCH_DEBOUNCE_MS = 300;

export function normalizePageResult<T>(data: Partial<PageResult<T>> | null | undefined): PageResult<T> {
  const content = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const page = data?.page ?? data?.number ?? 0;
  const size = data?.size ?? DEFAULT_PAGE_SIZE;
  return { content, totalElements, totalPages, page, size, number: data?.number ?? page };
}
