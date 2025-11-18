import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { type Company } from "@/types/company";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { CompanyDialog } from "../admin/hr/company/company-dialog";

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchCompany = async () => {
    try {
      const res = await apiClient.get(`/companies/${id}`);
      setCompany(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load company");
    } finally {
      setLoading(false);
    }
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
  }, []);

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
            onClick={() => navigate("/admin/companies")}
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
    </div>
  );
}
