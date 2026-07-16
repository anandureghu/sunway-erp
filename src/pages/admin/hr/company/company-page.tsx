// src/pages/admin/companies/CompanyListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/datatable";
import type { Company } from "@/types/company";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { getCompanyColumns } from "@/lib/columns/company-listing-admin";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyDialog } from "./company-dialog";
import { EmployeeDialog } from "../employee/employee-dialog";
import { CompanyAdminSetupDialog } from "./company-admin-setup-dialog";
import { AssignExistingUserDialog } from "./assign-existing-user-dialog";
import { useNavigate } from "react-router-dom";
import type { Row } from "@tanstack/react-table";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { PageHeader } from "@/components/PageHeader";

type StatusFilter = "all" | "active" | "inactive";

export default function CompanyListPage() {
  const { confirm } = useConfirmDialog();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Company | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [newCompanyForAdmin, setNewCompanyForAdmin] = useState<Company | null>(
    null,
  );

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
      setNewCompanyForAdmin(updated);
      setSetupDialogOpen(true);
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

  const handleDeactivate = async (company: Company) => {
    if (
      !(await confirm(
        `Deactivate "${company.companyName}"? Its users will no longer be able to log in until reactivated.`,
      ))
    ) {
      return;
    }
    try {
      await apiClient.delete(`/companies/${company.id}`);
      toast.success(`"${company.companyName}" deactivated`);
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, active: false } : c)),
      );
    } catch (err) {
      console.error("Deactivate failed:", err);
      toast.error(getApiErrorMessage(err, "Failed to deactivate company"));
    }
  };

  const handleReactivate = async (company: Company) => {
    try {
      const res = await apiClient.put(`/companies/${company.id}/reactivate`);
      toast.success(`"${company.companyName}" reactivated`);
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? res.data : c)),
      );
    } catch (err) {
      console.error("Reactivate failed:", err);
      toast.error(getApiErrorMessage(err, "Failed to reactivate company"));
    }
  };

  const navigate = useNavigate();

  const handleRowClick = (row: Row<Company>) => {
    const company = row.original;
    navigate(`/companies/${company.id}`);
  };

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return companies.filter((company) => {
      const active = company.active !== false;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);
      const matchesSearch =
        !q ||
        company.companyName?.toLowerCase().includes(q) ||
        company.companyCode?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [companies, searchQuery, statusFilter]);

  const columns = getCompanyColumns({
    onEdit: handleEdit,
    onDeactivate: handleDeactivate,
    onReactivate: handleReactivate,
  });

  const handleAdminSetupComplete = () => {
    setEmpDialogOpen(false);
    setAssignDialogOpen(false);
    setNewCompanyForAdmin(null);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading companies...</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Companies"
        variant="darkBlue"
        description="Manage every company tenant in this system"
        icon={<Building2 className="h-5 w-5 text-white" />}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by company name or code..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active only</SelectItem>
                  <SelectItem value="inactive">Inactive only</SelectItem>
                </SelectContent>
              </Select>
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
            data={filteredCompanies}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      <CompanyDialog
        open={open}
        onOpenChange={setOpen}
        company={selected}
        onSuccess={handleDialogSuccess}
      />

      {newCompanyForAdmin && (
        <>
          <CompanyAdminSetupDialog
            open={setupDialogOpen}
            onOpenChange={setSetupDialogOpen}
            company={newCompanyForAdmin}
            onCreateNew={() => setEmpDialogOpen(true)}
            onAssignExisting={() => setAssignDialogOpen(true)}
          />

          <EmployeeDialog
            open={empDialogOpen}
            onOpenChange={setEmpDialogOpen}
            companyId={newCompanyForAdmin.id}
            mode="create"
            presetRole="ADMIN"
            onSuccess={() => {
              toast.success("Admin created successfully!");
              handleAdminSetupComplete();
            }}
          />

          <AssignExistingUserDialog
            open={assignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            company={newCompanyForAdmin}
            onSuccess={handleAdminSetupComplete}
          />
        </>
      )}
    </div>
  );
}
