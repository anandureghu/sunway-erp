// src/pages/admin/companies/CompanyListPage.tsx
import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import type { Company } from "@/types/company";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { getCompanyColumns } from "@/lib/columns/company-listing-admin";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyDialog } from "./company-dialog";
import { EmployeeDialog } from "../employee/employee-dialog";
import { useNavigate } from "react-router-dom";
import type { Row } from "@tanstack/react-table";

export default function CompanyListPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Company | null>(null);
  const [open, setOpen] = useState(false);
  
  // State for admin employee dialog (opened after company creation)
  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [newCompanyForAdmin, setNewCompanyForAdmin] = useState<Company | null>(null);

  const fetchCompanies = async () => {
    try {
      const res = await apiClient.get("/companies");
      setCompanies(res.data);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDialogSuccess = (updated: Company, mode: "add" | "edit") => {
    if (mode === "add") {
      setCompanies((prev) => [...prev, updated]);
      // After adding a new company, prompt to create admin
      setNewCompanyForAdmin(updated);
      setEmpDialogOpen(true);
    } else {
      setCompanies((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    }
    setSelected(null);
  };

  const handleEdit = (company: Company) => {
    setSelected(company);
    setOpen(true);
  };

  const handleDelete = async (company: Company) => {
    try {
      await apiClient.delete(`/companies/${company.id}`);
      toast.success(`Deleted ${company.companyName}`);
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete company");
    }
  };

  const navigate = useNavigate();

  const handleRowClick = (row: Row<Company>) => {
    const company = row.original; // row.original = the full company object
    navigate(`/companies/${company.id}`);
  };

  const columns = getCompanyColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  const handleAdminCreated = () => {
    setEmpDialogOpen(false);
    setNewCompanyForAdmin(null);
    toast.success("Admin created successfully! You can now log in with the admin credentials.");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading companies...</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Companies</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by company name..."
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
            >
              Add New Company
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable
            columns={columns}
            data={companies}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      {/* Controlled Dialog (Add + Edit) */}
      <CompanyDialog
        open={open}
        onOpenChange={setOpen}
        company={selected}
        onSuccess={handleDialogSuccess}
      />

      {/* Admin Employee Dialog - Opens after company creation */}
      {newCompanyForAdmin && (
        <EmployeeDialog
          open={empDialogOpen}
          onOpenChange={setEmpDialogOpen}
          companyId={newCompanyForAdmin.id}
          mode="create"
          presetRole="ADMIN"
          onSuccess={handleAdminCreated}
        />
      )}
    </div>
  );
}
