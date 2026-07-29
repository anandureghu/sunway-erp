import {
  Trash2,
  Edit,
  Eye,
  MoreHorizontal,
  Briefcase,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TablePagination } from "@/components/table-pagination";
import { type JobCode } from "./shared";

export function JobCodesTable({
  rows,
  filteredCount,
  total,
  q,
  pageIndex,
  pageSize,
  pageCount,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
}: {
  rows: JobCode[];
  filteredCount: number;
  total: number;
  q: string;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  onPageChange: (i: number) => void;
  onPageSizeChange: (s: number) => void;
  onView: (jc: JobCode) => void;
  onEdit: (jc: JobCode) => void;
  onDelete: (jc: JobCode) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {total} job code{total === 1 ? "" : "s"}
          {q.trim() && ` · filtered`}
        </p>
      </div>
      <Table>
        <TableHeader className="bg-white">
          <TableRow>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-16">
              Sl No.
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Job Code
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Job Title
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Job Level
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Salary Grade
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Salary Range
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Status
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((j, i) => (
            <TableRow
              key={j.id}
              className={`border-b border-slate-100 transition-colors hover:bg-slate-50/60 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
            >
              <TableCell className="text-slate-500 tabular-nums">
                {pageIndex * pageSize + i + 1}
              </TableCell>
              <TableCell>
                <code className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                  {j.code}
                </code>
              </TableCell>
              <TableCell className="font-medium text-slate-900">
                {j.title}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  {j.level}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="border-yellow-300 text-yellow-700"
                >
                  {j.salaryGrade}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-slate-700">
                {j.minSalary != null || j.maxSalary != null ? (
                  <>
                    {j.minSalary != null ? Number(j.minSalary).toLocaleString() : "—"}
                    {" – "}
                    {j.maxSalary != null ? Number(j.maxSalary).toLocaleString() : "—"}
                  </>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </TableCell>
              <TableCell>
                {j.active ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      Active
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-400">
                      Inactive
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(j)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(j)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => onDelete(j)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {!filteredCount && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <Briefcase className="h-12 w-12 text-slate-300" />
                  <p className="text-slate-500 font-medium">
                    No job codes found
                  </p>
                  <p className="text-slate-400 text-sm">
                    Add your first job code to get started
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {filteredCount > 0 && (
        <div className="border-t border-slate-100 px-2">
          <TablePagination
            total={total}
            pageIndex={pageIndex}
            pageSize={pageSize}
            pageCount={pageCount}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
