// src/pages/admin/departments/DepartmentListPage.tsx
import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { getDepartmentColumns } from "@/lib/columns/department-listing-admin";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { Department } from "@/types/department";
import { DepartmentDialog } from "./department-dialog";
import { useAuth } from "@/context/AuthContext";
import { fetchDepartments, deleteDepartment as deleteDept } from "@/service/departmentService";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Company } from "@/types/company";
import { getAllCompanies } from "@/service/companyService";

export default function DepartmentListPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Department | null>(null);
  const [open, setOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const { user, company } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // Fetch companies for SUPER_ADMIN
  useEffect(() => {
    if (isSuperAdmin) {
      getAllCompanies().then((data) => {
        if (data && data.length > 0) {
          setCompanies(data);
          // Set default company if none selected
          if (selectedCompanyId === null) {
            setSelectedCompanyId(data[0].id);
          }
        }
      });
    }
  }, [isSuperAdmin]);

  // Set initial company for non-SUPER_ADMIN users from AuthContext
  useEffect(() => {
    if (!isSuperAdmin && company) {
      setSelectedCompanyId(Number(company.id));
    }
  }, [isSuperAdmin, company]);

  const fetchDepartmentsData = async () => {
    // Don't fetch if companyId is not available
    if (selectedCompanyId === null || selectedCompanyId === undefined) {
      setLoading(false);
      return;
    }
    
    try {
      const data = await fetchDepartments(selectedCompanyId);
      if (data) setDepartments(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentsData();
  }, [selectedCompanyId]);

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
    if (selectedCompanyId === null || selectedCompanyId === undefined) {
      toast.error("Company not selected");
      return;
    }
    
    try {
      await deleteDept(selectedCompanyId, dept.id);
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

  // Show message if no company selected
  if (!isSuperAdmin && !company) {
    return (
      <div className="p-6">
        <p className="text-center text-muted-foreground">
          Loading company information...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Departments</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search department..." className="pl-10" />
              </div>
              {isSuperAdmin && (
                <Select
                  value={selectedCompanyId?.toString() || ""}
                  onValueChange={(v) => setSelectedCompanyId(Number(v))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Add Department
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={departments} />
        </CardContent>
      </Card>

      {selectedCompanyId !== null && selectedCompanyId !== undefined && (
        <DepartmentDialog
          open={open}
          onOpenChange={setOpen}
          department={selected}
          onSuccess={handleSuccess}
          companyId={selectedCompanyId}
        />
      )}
    </div>
  );
}
