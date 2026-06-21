import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import {
  buildDepartmentTableRows,
  getDepartmentColumns,
} from "@/lib/columns/department-listing-admin";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { toast } from "sonner";
import type { Department } from "@/types/department";
import type { DivisionResponseDTO } from "@/types/division";
import { DepartmentDialog } from "./department-dialog";
import { DivisionDialog } from "../division/division-dialog";
import { useAuth } from "@/context/AuthContext";
import {
  fetchDepartments,
  deleteDepartment as deleteDept,
} from "@/service/departmentService";
import { fetchDivisions, deleteDivision } from "@/service/divisionService";
import { PageHeader } from "@/components/PageHeader";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";

export default function DepartmentListPage({
  hrSettings,
}: {
  hrSettings?: boolean;
}) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<DivisionResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  const [divisionDialogOpen, setDivisionDialogOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] =
    useState<DivisionResponseDTO | null>(null);

  const { company, user } = useAuth();
  const companyId =
    company?.id != null
      ? Number(company.id)
      : user?.companyId != null
        ? Number(user.companyId)
        : null;

  const loadData = async () => {
    if (companyId == null) {
      setLoading(false);
      return;
    }

    try {
      const [deptData, divData] = await Promise.all([
        fetchDepartments(companyId),
        fetchDivisions(companyId),
      ]);
      setDepartments(deptData ?? []);
      setDivisions((divData as DivisionResponseDTO[]) ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [companyId]);

  const tableRows = useMemo(() => {
    const rows = buildDepartmentTableRows(departments, divisions);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;

    return rows
      .map((row) => {
        const deptMatches =
          row.name.toLowerCase().includes(q) ||
          row.code.toLowerCase().includes(q);
        const matchingChildren =
          row.subRows?.filter(
            (child) =>
              child.name.toLowerCase().includes(q) ||
              child.code.toLowerCase().includes(q),
          ) ?? [];

        if (deptMatches) return row;
        if (matchingChildren.length > 0) {
          return { ...row, subRows: matchingChildren };
        }
        return null;
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
  }, [departments, divisions, searchQuery]);

  const handleDepartmentSuccess = (updated: Department, mode: "add" | "edit") => {
    if (mode === "add") {
      setDepartments((prev) => [...prev, updated]);
    } else {
      setDepartments((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)),
      );
    }
  };

  const handleDivisionSuccess = (
    updated: DivisionResponseDTO,
    mode: "add" | "edit",
  ) => {
    if (mode === "add") {
      setDivisions((prev) => [...prev, updated]);
    } else {
      setDivisions((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)),
      );
    }
  };

  const handleDeleteDepartment = async (dept: Department) => {
    if (companyId == null) {
      toast.error("Company not loaded");
      return;
    }

    const hasDivisions = divisions.some((d) => d.departmentId === dept.id);
    if (hasDivisions) {
      toast.error("Delete divisions under this department first");
      return;
    }

    try {
      await deleteDept(companyId, dept.id);
      toast.success(`Deleted ${dept.departmentName}`);
      setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
    } catch {
      toast.error("Failed to delete department");
    }
  };

  const handleDeleteDivision = async (division: DivisionResponseDTO) => {
    try {
      await deleteDivision(division.id);
      toast.success(`Deleted ${division.name}`);
      setDivisions((prev) => prev.filter((d) => d.id !== division.id));
    } catch {
      toast.error("Failed to delete division");
    }
  };

  const columns = getDepartmentColumns({
    onEditDepartment: (dept) => {
      setSelectedDepartment(dept);
      setDepartmentDialogOpen(true);
    },
    onDeleteDepartment: handleDeleteDepartment,
    onEditDivision: (division) => {
      setSelectedDivision(division);
      setDivisionDialogOpen(true);
    },
    onDeleteDivision: handleDeleteDivision,
  });

  if (loading)
    return <p className="text-center text-muted-foreground p-10">Loading...</p>;

  if (companyId == null) {
    return (
      <div className="p-6">
        <p className="text-center text-muted-foreground">
          Loading company information...
        </p>
      </div>
    );
  }

  return (
    <div className={hrSettings ? "space-y-6" : "p-6 space-y-6"}>
      {hrSettings ? (
        <SecondaryPageHeader
          title="Departments"
          description="Manage departments and their divisions"
          icon={<Users className="h-5 w-5" />}
        />
      ) : (
        <PageHeader
          title="Departments"
          description="Manage departments and their divisions"
          variant="darkBlue"
          icon={<Users className="w-6 h-6" />}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search department or division..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDivision(null);
                  setDivisionDialogOpen(true);
                }}
              >
                Add Division
              </Button>
              <Button
                onClick={() => {
                  setSelectedDepartment(null);
                  setDepartmentDialogOpen(true);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Add Department
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {tableRows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No departments found
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={tableRows}
              getSubRows={(row) => row.subRows}
            />
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Click a department row to expand and view its divisions.
          </p>
        </CardContent>
      </Card>

      <DepartmentDialog
        open={departmentDialogOpen}
        onOpenChange={setDepartmentDialogOpen}
        department={selectedDepartment}
        onSuccess={handleDepartmentSuccess}
        companyId={companyId}
      />

      <DivisionDialog
        open={divisionDialogOpen}
        onOpenChange={setDivisionDialogOpen}
        division={selectedDivision}
        onSuccess={handleDivisionSuccess}
        companyId={companyId}
      />
    </div>
  );
}
