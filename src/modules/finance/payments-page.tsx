"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { PaymentResponseDTO } from "@/types/payment";
import { PAYMENT_COLUMNS } from "@/lib/columns/finance/payment-colums";
import { PaymentDialog } from "./payment-dialog";

export default function PaymentsPage({ companyId }: { companyId: number }) {
  const [payments, setPayments] = useState<PaymentResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PaymentResponseDTO | null>(null);
  const [open, setOpen] = useState(false);

  const fetchPayments = async () => {
    try {
      const res = await apiClient.get(`/finance/payments/company/${companyId}`);
      setPayments(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [companyId]);

  const handleDialogSuccess = (
    updated: PaymentResponseDTO,
    mode: "add" | "edit"
  ) => {
    if (mode === "add") setPayments((prev) => [...prev, updated]);
    else
      setPayments((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );

    setSelected(null);
  };

  const handleEdit = (payment: PaymentResponseDTO) => {
    setSelected(payment);
    setOpen(true);
  };

  const handleDelete = async (payment: PaymentResponseDTO) => {
    try {
      await apiClient.delete(`/finance/payments/${payment.id}`);
      toast.success("Payment deleted");
      setPayments((prev) => prev.filter((p) => p.id !== payment.id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete payment");
    }
  };

  const columns = PAYMENT_COLUMNS({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  if (loading)
    return (
      <div className="flex h-64 justify-center items-center">
        Loading payments...
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Customer Payments</h1>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search payments..." className="pl-10" />
            </div>

            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
            >
              Add Payment
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable data={payments} columns={columns} />
        </CardContent>
      </Card>

      <PaymentDialog
        open={open}
        onOpenChange={setOpen}
        data={selected}
        companyId={companyId}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
