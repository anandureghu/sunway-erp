import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Client-side pagination state for a list that is already fully loaded.
 * Mirrors the behaviour of the TanStack <DataTable> footer so hand-rolled
 * tables can share the same paging UX.
 */
export function usePagination<T>(items: T[], initialPageSize = 10) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSizeRaw] = useState(initialPageSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Keep the page index in range when the underlying list shrinks
  // (filtering, approving/rejecting rows, deleting records, etc.).
  useEffect(() => {
    if (pageIndex > pageCount - 1) setPageIndex(pageCount - 1);
  }, [pageIndex, pageCount]);

  const pageItems = useMemo(
    () => items.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize),
    [items, pageIndex, pageSize],
  );

  const setPageSize = (size: number) => {
    setPageSizeRaw(size);
    setPageIndex(0);
  };

  return {
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    pageCount,
    total,
    pageItems,
  };
}

export type ServerPaginationProps = {
  total: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  onPageChange: (index: number) => void;
  onPageSizeChange: (size: number) => void;
};

type TablePaginationProps = ServerPaginationProps & {
  pageSizeOptions?: number[];
  className?: string;
};

/**
 * Presentational footer: total · rows/page · page X of Y · nav.
 * Wraps and uses compact gaps so it fits narrow panels (e.g. Delivery Tracking
 * Dispatches column) without overflowing the parent card.
 */
export function TablePagination({
  total,
  pageIndex,
  pageSize,
  pageCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
}: TablePaginationProps) {
  const canPrevious = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1 py-3 sm:px-2 sm:py-4",
        className,
      )}
    >
      <div className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
        {total} row(s) total
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <p className="whitespace-nowrap text-sm font-medium">Rows</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="whitespace-nowrap text-sm font-medium tabular-nums">
          Page {pageIndex + 1} of {pageCount}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(0)}
            disabled={!canPrevious}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!canPrevious}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!canNext}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(pageCount - 1)}
            disabled={!canNext}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TablePagination;
