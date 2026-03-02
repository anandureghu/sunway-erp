"use client";

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/datatable";

import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";

import { getBudgetLineColumns } from "@/lib/columns/finance/budget-line-columns";

import type { BudgetResponseDTO, BudgetLineDTO } from "@/types/budget";
import { BudgetLineDialog } from "./budget-line-dialog";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function BudgetDetailPage() {
  const { id } = useParams();
  const { user, company } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<BudgetResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLineDTO | null>(null);

  // ---------------------------
  // Load budget
  // ---------------------------
  const fetchOne = async () => {
    try {
      const res = await apiClient.get(`/finance/budgets/${id}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load budget:", err);
      toast.error("Failed to load budget");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOne();
  }, [id]);

  // ---------------------------
  // Delete line
  // ---------------------------
  const deleteLine = async (line: BudgetLineDTO) => {
    try {
      await apiClient.delete(`/finance/budgets/${id}/lines/${line.id}`);
      toast.success("Line deleted");
      fetchOne();
    } catch {
      toast.error("Failed to delete line");
    }
  };

  // ---------------------------
  // Table columns
  // ---------------------------
  const columns = getBudgetLineColumns({
    onEdit: (line) => {
      setEditingLine(line);
      setLineDialogOpen(true);
    },
    onDelete: deleteLine,
    company: company!,
    role: user?.role,
  });

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">Not Found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {/* <h1 className="text-2xl font-semibold">
          Budget: {data.budgetName} ({data.budgetYear})
        </h1> */}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            {/* LEFT SIDE */}
            <div className="space-y-4 w-full">
              {/* Budget Title */}
              <div>
                <h2 className="text-2xl font-semibold">
                  Budget: {data.budgetName}
                </h2>
                <p className="text-muted-foreground">
                  Fiscal Year {data.fiscalYear}
                </p>
              </div>
            </div>

            {/* RIGHT SIDE BUTTON */}
            <div className="ml-6">
              <Button
                onClick={() => {
                  setEditingLine(null);
                  setLineDialogOpen(true);
                }}
              >
                Add Budget Distribution
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            {/* Amount */}
            <div className="rounded-lg border p-4 bg-blue-50 text-blue-600">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-xl font-semibold">
                {company?.currency?.currencyCode || " "} {data.amount}
              </p>
            </div>

            {/* Status */}
            <div
              className={`rounded-lg border p-4 ${
                data.status === "IMPLEMENTED"
                  ? "bg-green-50 text-green-600"
                  : "bg-gray-100 text-purple-600"
              }`}
            >
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-xl font-semibold">{data.status}</p>
            </div>

            {/* Budget Year */}
            <div className="rounded-lg border p-4 bg-yellow-50 text-yellow-600">
              <p className="text-sm text-muted-foreground">Fiscal Year</p>
              <p className="text-xl font-semibold">{data.fiscalYear}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable data={data.lines} columns={columns} />
        </CardContent>
      </Card>

      {lineDialogOpen && (
        <BudgetLineDialog
          open={lineDialogOpen}
          onOpenChange={setLineDialogOpen}
          line={editingLine}
          budgetId={Number(id) || 0}
          onSuccess={() => {
            setLineDialogOpen(false);
            setEditingLine(null);
            fetchOne();
          }}
        />
      )}
    </div>
  );
}
