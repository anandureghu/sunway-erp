import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SEARCH_DEBOUNCE_MS,
  normalizePageResult,
  type PageResult,
} from "@/types/page";

type FetcherParams<F> = {
  page: number;
  size: number;
  search: string;
} & F;

type UseServerPagedListOptions<T, F extends Record<string, unknown>> = {
  fetcher: (params: FetcherParams<F>) => Promise<PageResult<T> | Partial<PageResult<T>>>;
  /** Extra query filters; changing them resets to page 0 and refetches. */
  filters?: F;
  pageSize?: number;
  debounceMs?: number;
  enabled?: boolean;
  errorMessage?: string;
};

/**
 * Server-side pagination + debounced search (default size 20, debounce 300ms).
 * Matches CRM enquiries / admin enquiries behavior.
 */
export function useServerPagedList<T, F extends Record<string, unknown> = Record<string, never>>({
  fetcher,
  filters,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  debounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
  enabled = true,
  errorMessage = "Failed to load list",
}: UseServerPagedListOptions<T, F>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  const filtersKey = JSON.stringify(filters ?? {});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [searchInput, debounceMs]);

  useEffect(() => {
    setPage(0);
  }, [filtersKey]);

  const load = useCallback(async () => {
    if (!enabled) {
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const filterParams = (filters ?? {}) as F;
      const data = normalizePageResult(
        await fetcher({
          page,
          size: pageSize,
          search,
          ...filterParams,
        }),
      );
      setRows(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch {
      toast.error(errorMessage);
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
    // filtersKey stands in for filters object identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetcher, page, pageSize, search, filtersKey, errorMessage, reloadToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(0);
  }, []);

  const reload = useCallback(() => {
    setReloadToken((n) => n + 1);
  }, []);

  return {
    rows,
    loading,
    searchInput,
    setSearchInput,
    search,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    totalPages,
    pageCount: Math.max(totalPages, totalElements === 0 ? 0 : 1),
    reload,
  };
}
