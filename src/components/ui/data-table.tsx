"use client";
import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  type SortingState,
  type ExpandedState,
  useReactTable,
} from "@tanstack/react-table";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  onRowClick?: (row: TData) => void;

  // 👇 optional, only needed if you want sub-rows
  getSubRows?: (row: TData) => TData[] | undefined;
};

export function DataTable<TData>({
  columns,
  data,
  onRowClick,
  getSubRows,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, expanded },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,

    getSubRows, // 👈 key line

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <span className="text-xs text-gray-400">
                          {sorted === "asc"
                            ? "▲"
                            : sorted === "desc"
                            ? "▼"
                            : "⇅"}
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
              onClick={(e) => {
                if (row.getCanExpand()) row.getToggleExpandedHandler()();
                if ((e.target as HTMLElement).closest("button")) return;
                onRowClick?.(row.original);
              }}
              className={
                "border-t border-gray-200 transition-colors " +
                (idx % 2 === 0 ? "bg-white" : "bg-gray-50/50") +
                " hover:bg-gray-100"
              }
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 py-3 text-gray-900"
                  style={{
                    paddingLeft: row.depth
                      ? `${row.depth * 1.25 + 1}rem`
                      : undefined,
                  }}
                >
                  {/* 👇 tiny expand icon, only if row has children */}
                  {cell.column.id === "name" && row.getCanExpand() && (
                    <button
                      onClick={row.getToggleExpandedHandler()}
                      className="mr-2 text-gray-500 hover:text-gray-900 float-left"
                    >
                      {row.getIsExpanded() ? "▼" : "▶"}
                    </button>
                  )}

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
  );
}
