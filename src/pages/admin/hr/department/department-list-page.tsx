// src/pages/admin/departments/DepartmentListPage.tsx
import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { getDepartmentColumns } from "@/lib/columns/department-listing-admin";
import { apiClient } from "@/service/apiClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { Department } from "@/types/department";
import { DepartmentDialog } from "./department-dialog";

export default function DepartmentListPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Department | null>(null);
  const [open, setOpen] = useState(false);

  const fetchDepartments = async () => {
    try {
      const res = await apiClient.get("/departments");
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSuccess = (updated: Department, mode: "add" | "edit") => {
    if (mode === "add") {
      setDepartments((prev) => [...prev, updated]);
    } else {
      setDepartments((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
    }
  };

  const handleEdit = (dept: Department) => {
    setSelected(dept);
    setOpen(true);
  };

  const handleDelete = async (dept: Department) => {
    try {
      await apiClient.delete(`/departments/${dept.id}`);
      toast.success(`Deleted ${dept.departmentName}`);
      setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
    } catch {
      toast.error("Failed to delete department");
    }
  };

  const columns = getDepartmentColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  if (loading)
    return <p className="text-center text-muted-foreground p-10">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Departments</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search department..." className="pl-10" />
            </div>
            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
            >
              Add Department
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={departments} />
        </CardContent>
      </Card>

      <DepartmentDialog
        open={open}
        onOpenChange={setOpen}
        department={selected}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
