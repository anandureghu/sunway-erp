import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Department } from "@/types/department";
import type { DivisionResponseDTO } from "@/types/division";
import type { ColumnDef } from "@tanstack/react-table";

export type DepartmentTableRow = {
  id: string;
  code: string;
  name: string;
  managerName: string;
  rowType: "department" | "division";
  department?: Department;
  division?: DivisionResponseDTO;
  subRows?: DepartmentTableRow[];
};

interface DepartmentColumnsProps {
  onEditDepartment: (dept: Department) => void;
  onDeleteDepartment: (dept: Department) => void;
  onEditDivision: (division: DivisionResponseDTO) => void;
  onDeleteDivision: (division: DivisionResponseDTO) => void;
}

function managerLabel(
  first?: string | null,
  last?: string | null,
): string {
  const name = [first, last].filter(Boolean).join(" ").trim();
  return name || "—";
}

export function buildDepartmentTableRows(
  departments: Department[],
  divisions: DivisionResponseDTO[],
): DepartmentTableRow[] {
  return departments.map((dept) => {
    const childDivisions = divisions.filter((d) => d.departmentId === dept.id);
    return {
      id: `dept-${dept.id}`,
      code: dept.departmentCode,
      name: dept.departmentName,
      managerName: managerLabel(dept.managerFirstName, dept.managerLastName),
      rowType: "department",
      department: dept,
      subRows: childDivisions.map((div) => ({
        id: `div-${div.id}`,
        code: div.code,
        name: div.name,
        managerName: managerLabel(div.managerFirstName, div.managerLastName),
        rowType: "division",
        division: div,
      })),
    };
  });
}

export const getDepartmentColumns = ({
  onEditDepartment,
  onDeleteDepartment,
  onEditDivision,
  onDeleteDivision,
}: DepartmentColumnsProps): ColumnDef<DepartmentTableRow>[] => [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    enableSorting: true,
    cell: ({ row }) => {
      const item = row.original;
      const isDivision = item.rowType === "division";
      const childCount = item.subRows?.length ?? 0;

      return (
        <div className="flex items-center gap-2 min-w-0">
          {isDivision && (
            <span className="text-xs text-slate-400 font-mono shrink-0">└─</span>
          )}
          <div className="min-w-0">
            <span
              className={
                isDivision
                  ? "text-sm text-blue-700"
                  : "text-sm font-medium text-slate-900"
              }
            >
              {item.name}
              {!isDivision && childCount > 0 ? (
                <span className="ml-1.5 text-xs font-normal text-slate-400">
                  ({childCount})
                </span>
              ) : null}
            </span>
            {isDivision && (
              <p className="text-[11px] text-slate-400 mt-0.5">Division</p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "code",
    header: "Code",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-slate-700">
        {row.original.code}
      </span>
    ),
  },
  {
    accessorKey: "managerName",
    header: "Manager",
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.managerName}</span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const item = row.original;

      if (item.rowType === "division" && item.division) {
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEditDivision(item.division!);
              }}
            >
              <Pencil className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDivision(item.division!);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      }

      if (item.department) {
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEditDepartment(item.department!);
              }}
            >
              <Pencil className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDepartment(item.department!);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      }

      return null;
    },
  },
];
