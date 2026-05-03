import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/service/apiClient";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SalesOrderDetailCards } from "./components/sales-order-detail-cards";
import { SalesPageHeader } from "./components/sales-page-header";
import { CurrencyAmount } from "@/components/currency/currency-amount";

const SalesOrdersDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [so, setSo] = useState<SalesOrderResponseDTO | null>(null);

  const updateStatus = async (action: "confirm" | "cancel") => {
    if (!so) return;

    try {
      await apiClient.post(`/sales/orders/${so.id}/${action}`);
      const { data } = await apiClient.get<SalesOrderResponseDTO>(
        `/sales/orders/${so.id}`,
      );
      setSo(data);
    } catch (error) {
      console.error("Status update failed", error);
    }
  };

  useEffect(() => {
    apiClient
      .get<SalesOrderResponseDTO>(`/sales/orders/${id}`)
      .then(({ data }) => setSo(data));
  }, [id]);

  if (!so) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  const status = (so.status || "").toUpperCase();
  const statusMeta =
    status === "CANCELLED"
      ? {
          label: "Cancelled",
          icon: XCircle,
          className: "border-rose-200 bg-rose-100 text-rose-700",
        }
      : status === "COMPLETED"
        ? {
            label: "Completed",
            icon: CheckCircle2,
            className: "border-emerald-200 bg-emerald-100 text-emerald-800",
          }
        : status === "CONFIRMED"
          ? {
              label: "Confirmed",
              icon: CheckCircle2,
              className: "border-emerald-200 bg-emerald-100 text-emerald-700",
            }
          : {
              label: "Draft",
              icon: Clock3,
              className: "border-amber-200 bg-amber-100 text-amber-700",
            };
  const StatusIcon = statusMeta.icon;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <SalesPageHeader
        title={`Order ${so.orderNumber}`}
        description={`Order date: ${so.orderDate || "N/A"}`}
        onBack={() => navigate("/inventory/sales/orders")}
        actions={
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <Badge
              variant="outline"
              className={`justify-center border px-3 py-1 text-xs font-medium sm:justify-end ${statusMeta.className}`}
            >
              <StatusIcon className="mr-1 h-3.5 w-3.5" />
              {statusMeta.label}
            </Badge>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-white/70">
                Order value
              </p>
              <CurrencyAmount
                amount={so.totalAmount ?? 0}
                className="text-2xl font-bold text-white"
              />
            </div>
          </div>
        }
      />

      {so.status === "DRAFT" && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => updateStatus("confirm")}>Confirm Order</Button>
          <Button variant="destructive" onClick={() => updateStatus("cancel")}>
            Cancel Order
          </Button>
        </div>
      )}

      <SalesOrderDetailCards so={so} />
    </div>
  );
};

export default SalesOrdersDetailPage;
