import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { type Company } from "@/types/company";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { CompanyDialog } from "../admin/hr/company/company-dialog";
import { EmployeeDialog } from "../admin/hr/employee/employee-dialog";
import type { Employee } from "@/types/hr";

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // admin state
  const [admin, setAdmin] = useState<Employee | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [, setAdminError] = useState<string | null>(null);
  const [openEditAdmin, setOpenEditAdmin] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);

  const [openCreateAdmin, setOpenCreateAdmin] = useState(false);

  const handleCreateAdmin = () => {
    setOpenCreateAdmin(true);
  };

  const fetchCompany = async () => {
    try {
      const res = await apiClient.get(`/companies/${id}`);
      setCompany(res.data);
    } catch (err) {
      console.error("fetchCompany:", err);
      toast.error("Failed to load company");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyAdmin = async () => {
    if (!id) return;
    setAdminLoading(true);
    setAdminError(null);
    // backend endpoint you showed: GET /employees/admin/{companyId}
    apiClient
      .get(`/employees/admin/${id}`)
      .then((res) => {
        setAdmin(res.data);
      })
      .catch((err) => {
        // if API returns 500 with message "No admin exists for this company"
        // treat it as "no admin" instead of fatal error
        console.warn("fetchCompanyAdmin:", err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to check company admin";
        // if the backend uses 500 for "no admin", check that message and suppress toast
        if (
          message?.toLowerCase().includes("no admin") ||
          err?.response?.status === 404
        ) {
          setAdmin(null);
          // set adminError only for UI logic, no toast
          setAdminError("No admin exists");
        } else {
          // unexpected error - show toast
          setAdminError(message);
          toast.error("Failed to check admin");
        }
      })
      .finally(() => {
        setAdminLoading(false);
      });
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/companies/${id}`);
      toast.success("Company deleted");
      navigate("/admin/companies");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting company");
    }
  };

  useEffect(() => {
    fetchCompany();
    fetchCompanyAdmin();
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );

  if (!company)
    return (
      <div className="p-6">
        <p className="text-red-500">Company not found.</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/company")}
            className="flex gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-semibold">{company.companyName}</h1>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>

          <Button variant="destructive" onClick={handleDelete}>
            <Trash className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Company No:</span> {company.crNo}
            </p>
            <p>
              <span className="font-semibold">Employees:</span>{" "}
              {company.noOfEmployees}
            </p>
            <p>
              <span className="font-semibold">Phone:</span> {company.phoneNo}
            </p>
            <p>
              <span className="font-semibold">Computer Card:</span>{" "}
              {company.computerCard || "-"}
            </p>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Street:</span> {company.street}
            </p>
            <p>
              <span className="font-semibold">City:</span> {company.city}
            </p>
            <p>
              <span className="font-semibold">State:</span> {company.state}
            </p>
            <p>
              <span className="font-semibold">Country:</span> {company.country}
            </p>
          </CardContent>
        </Card>

        {/* Subscribed Modules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subscribed Modules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">HR:</span>{" "}
              {company.hrEnabled ? (
                <span className="text-green-600 font-semibold">Enabled</span>
              ) : (
                <span className="text-red-500">Disabled</span>
              )}
            </p>
            <p>
              <span className="font-semibold">Finance:</span>{" "}
              {company.financeEnabled ? (
                <span className="text-green-600 font-semibold">Enabled</span>
              ) : (
                <span className="text-red-500">Disabled</span>
              )}
            </p>
            <p>
              <span className="font-semibold">Inventory:</span>{" "}
              {company.inventoryEnabled ? (
                <span className="text-green-600 font-semibold">Enabled</span>
              ) : (
                <span className="text-red-500">Disabled</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Card / Create Admin */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminLoading ? (
              <p className="text-muted-foreground">Checking for admin...</p>
            ) : admin ? (
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-semibold">Name:</span> {admin.firstName}{" "}
                  {admin.lastName}
                </p>
                <p>
                  <span className="font-semibold">Role:</span> {admin.role}
                </p>
                <p>
                  <span className="font-semibold">Phone:</span>{" "}
                  {admin.phoneNo || "-"}
                </p>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/admin/employees/${admin.id}`)}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditEmployee(admin);
                      setOpenEditAdmin(true);
                    }}
                  >
                    Edit Admin
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    No admin exists for this company.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Create an admin to manage company HR and permissions.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateAdmin}>Create Admin</Button>
                  {/* If you want an automatic creation (POST) you could add a different button that calls the POST /api/employees with role ADMIN.
                      For safety UX we prefer navigating to the create form so the user can enter details. */}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <CompanyDialog
        open={open}
        onOpenChange={setOpen}
        company={company}
        onSuccess={() => {
          setOpen(false);
          fetchCompany();
        }}
      />

      <EmployeeDialog
        open={openCreateAdmin}
        onOpenChange={setOpenCreateAdmin}
        companyId={Number(id)}
        presetRole="ADMIN"
        onSuccess={() => {
          setOpenCreateAdmin(false);
          fetchCompanyAdmin(); // Refresh admin info immediately
        }}
      />

      {editEmployee && (
        <EmployeeDialog
          open={openEditAdmin}
          onOpenChange={setOpenEditAdmin}
          mode="edit"
          employee={editEmployee}
          employeeId={editEmployee?.id}
          companyId={company.id} // important
          presetRole="ADMIN"
          onSuccess={() => {
            setOpenEditAdmin(false);
            fetchCompanyAdmin();
          }}
        />
      )}
    </div>
  );
}
