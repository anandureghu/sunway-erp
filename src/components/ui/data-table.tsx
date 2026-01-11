"use client";
import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
};

export function DataTable<TData>({ columns, data, onRowClick }: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th 
                    key={header.id} 
                    className="px-4 py-3 text-left select-none font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap"
                  >
                    {canSort ? (
                      <button
                        className="inline-flex items-center gap-1.5 hover:text-gray-900 transition-colors whitespace-nowrap"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="whitespace-nowrap">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        <span className="text-xs text-gray-400">
                          {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "⇅"}
                        </span>
                      </button>
                    ) : (
                      <span className="whitespace-nowrap">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
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
              className={
                "border-t border-gray-200 transition-colors " +
                (idx % 2 === 0 ? "bg-white" : "bg-gray-50/50") +
                " hover:bg-gray-100"
              }
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-gray-900">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}

          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500" colSpan={columns.length}>
                No rows
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
