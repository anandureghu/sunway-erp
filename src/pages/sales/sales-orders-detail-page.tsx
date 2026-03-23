import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/service/apiClient";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { ArrowLeft, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SalesOrderDetailCards } from "./components/sales-order-detail-cards";

const SalesOrdersDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [so, setSo] = useState<SalesOrderResponseDTO | null>(null);

  const updateStatus = async (action: "confirm" | "cancel") => {
    if (!so) return;

    try {
      await apiClient.post(`/sales/orders/${so.id}/${action}`);
      const { data } = await apiClient.get<SalesOrderResponseDTO>(
        `/sales/orders/${so.id}`
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
    status === "CONFIRMED"
      ? {
          label: "Confirmed",
          icon: CheckCircle2,
          className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        }
      : status === "CANCELLED"
        ? {
            label: "Cancelled",
            icon: XCircle,
            className: "bg-rose-100 text-rose-700 border-rose-200",
          }
        : {
            label: "Draft",
            icon: Clock3,
            className: "bg-amber-100 text-amber-700 border-amber-200",
          };
  const StatusIcon = statusMeta.icon;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="rounded-2xl border bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-800 text-white shadow-sm">
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate(-1)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
            <Badge
              variant="outline"
              className={`border px-3 py-1 text-xs font-medium ${statusMeta.className}`}
            >
              <StatusIcon className="mr-1 h-3.5 w-3.5" />
              {statusMeta.label}
            </Badge>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Sales Order</p>
              <h1 className="text-2xl sm:text-3xl font-semibold">#{so.orderNumber}</h1>
              <p className="text-sm text-white/70 mt-1">Order Date: {so.orderDate || "N/A"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-white/70">Order Value</p>
              <p className="text-2xl font-bold">₹ {so.totalAmount?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        </div>
      </div>

      {so.status !== "CONFIRMED" && so.status !== "CANCELLED" && (
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
