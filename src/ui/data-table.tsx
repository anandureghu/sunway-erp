"use client";
import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { TablePagination } from "@/components/table-pagination";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  defaultPageSize?: number;
};

export function DataTable<TData>({
  columns,
  data,
  onRowClick,
  defaultPageSize = 10,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: defaultPageSize },
    },
  });

  const { pageIndex, pageSize } = table.getState().pagination;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border border-slate-200/70 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className="select-none"
                  >
                    {canSort ? (
                      <button
                        className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <span className="text-xs text-gray-500">
                          {sorted === "asc"
                            ? "▲"
                            : sorted === "desc"
                            ? "▼"
                            : ""}
                        </span>
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, idx) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={`border-t cursor-pointer transition-colors ${
                idx % 2 ? "bg-gray-50/60" : "bg-white"
              } hover:bg-gray-100`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td
                className="px-4 py-6 text-center text-gray-500"
                colSpan={columns.length}
              >
                No rows
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      {data.length > 0 && (
        <TablePagination
          total={data.length}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={table.getPageCount() || 1}
          onPageChange={(index) => table.setPageIndex(index)}
          onPageSizeChange={(size) => table.setPageSize(size)}
        />
      )}
    </div>
  );
}
