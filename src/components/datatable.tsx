import {
  type ColumnDef,
  type Row,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "./ui/table";
import {
  TablePagination,
  type ServerPaginationProps,
} from "@/components/table-pagination";
import { cn } from "@/lib/utils";

export type { ServerPaginationProps };

// src/components/datatable.tsx
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: Row<TData>) => void;
  defaultPageSize?: number;
  hideSlNo?: boolean;
  /** When set, pagination is server-driven (no client slicing). */
  serverPagination?: ServerPaginationProps;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  defaultPageSize = 10,
  hideSlNo = false,
  serverPagination,
}: DataTableProps<TData, TValue>) {
  const slNoOffset = serverPagination
    ? serverPagination.pageIndex * serverPagination.pageSize
    : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slNoColumn: ColumnDef<any, any> = {
    id: "slNo",
    header: () => (
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        SL No.
      </span>
    ),
    cell: ({ row }: { row: { index: number } }) => (
      <span className="text-muted-foreground text-sm font-medium tabular-nums">
        {slNoOffset + row.index + 1}
      </span>
    ),
  };

  const allColumns = hideSlNo
    ? columns
    : [slNoColumn as ColumnDef<TData, unknown>, ...columns];

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: serverPagination
      ? undefined
      : getPaginationRowModel(),
    manualPagination: !!serverPagination,
    pageCount: serverPagination?.pageCount,
    initialState: {
      pagination: {
        pageSize: serverPagination?.pageSize ?? defaultPageSize,
        pageIndex: serverPagination?.pageIndex ?? 0,
      },
    },
  });

  const pagination = serverPagination
    ? serverPagination
    : {
        total: data.length,
        pageIndex: table.getState().pagination.pageIndex,
        pageSize: table.getState().pagination.pageSize,
        pageCount: table.getPageCount() || 1,
        onPageChange: (index: number) => table.setPageIndex(index),
        onPageSizeChange: (size: number) => table.setPageSize(size),
      };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <Table className="bg-card">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  "transition-colors",
                  row.index % 2 === 1 ? "bg-slate-50/40" : "bg-white",
                  onRowClick
                    ? "cursor-pointer hover:bg-slate-100/70"
                    : "hover:bg-slate-50/70",
                )}
                onClick={(e) => {
                  if (
                    (e.target as HTMLElement).closest("[data-no-row-nav]")
                  ) {
                    return;
                  }
                  onRowClick?.(row);
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={allColumns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>

      {(serverPagination || data.length > 0) && (
        <TablePagination
          total={pagination.total}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          pageCount={pagination.pageCount}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}
    </div>
  );
}
