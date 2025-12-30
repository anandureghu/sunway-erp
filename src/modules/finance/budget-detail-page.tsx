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

export default function BudgetDetailPage() {
  const { id } = useParams();
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
        <h1 className="text-2xl font-semibold">
          Budget: {data.budgetName} ({data.budgetYear})
        </h1>
      </div>

      <Card>
        <CardHeader className="flex justify-between">
          <div>
            <p>Amount: {data.amount}</p>
            <p
              style={{
                color:
                  data.balance == 0 || (data.balance || 0) < 0
                    ? "red"
                    : "green",
              }}
            >
              Remaining: {data.balance}
            </p>
            <p>Status: {data.status}</p>
            <p>Start: {data.startDate}</p>
            <p>End: {data.endDate}</p>
          </div>

          <Button
            onClick={() => {
              setEditingLine(null);
              setLineDialogOpen(true);
            }}
          >
            Add Budget Distribution
          </Button>
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
