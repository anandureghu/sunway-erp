import {
  type ColumnDef,
  type Row,
  type RowSelectionState,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import {
  TablePagination,
  type ServerPaginationProps,
} from "@/components/table-pagination";

export type { ServerPaginationProps };

type SelectableDataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: Row<TData>) => void;
  defaultPageSize?: number;
  hideSlNo?: boolean;
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  getRowId?: (row: TData) => string;
  isRowSelectable?: (row: TData) => boolean;
  /** When set, pagination is server-driven (no client slicing). */
  serverPagination?: ServerPaginationProps;
};

export function SelectableDataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  defaultPageSize = 10,
  hideSlNo = false,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  isRowSelectable,
  serverPagination,
}: SelectableDataTableProps<TData, TValue>) {
  const selectionColumn: ColumnDef<TData, unknown> = {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        data-no-row-nav
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all rows on page"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        data-no-row-nav
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  const slNoOffset = serverPagination
    ? serverPagination.pageIndex * serverPagination.pageSize
    : 0;

  const slNoColumn: ColumnDef<TData, unknown> = {
    id: "slNo",
    header: "SL No.",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm font-medium tabular-nums">
        {slNoOffset + row.index + 1}
      </span>
    ),
  };

  const allColumns = [
    ...(enableRowSelection ? [selectionColumn] : []),
    ...(hideSlNo ? [] : [slNoColumn]),
    ...columns,
  ];

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: serverPagination
      ? undefined
      : getPaginationRowModel(),
    manualPagination: !!serverPagination,
    pageCount: serverPagination?.pageCount,
    enableRowSelection: enableRowSelection
      ? (row) => (isRowSelectable ? isRowSelectable(row.original) : true)
      : false,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    onRowSelectionChange: onRowSelectionChange
      ? (updater) => {
          const next =
            typeof updater === "function"
              ? updater(rowSelection ?? {})
              : updater;
          onRowSelectionChange(next);
        }
      : undefined,
    state: {
      rowSelection: rowSelection ?? {},
    },
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
                  data-state={row.getIsSelected() ? "selected" : undefined}
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  className="h-24 text-center"
                >
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
