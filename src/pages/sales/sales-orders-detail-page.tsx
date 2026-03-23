import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/service/apiClient";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { ArrowLeft } from "lucide-react";
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

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Button variant="secondary" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Sales Order #{so.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            Order Date: {so.orderDate}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {so.status}
        </Badge>
      </div>

      <div className="flex gap-2">
        {so.status !== "CONFIRMED" && so.status !== "CANCELLED" && (
          <>
            <Button onClick={() => updateStatus("confirm")}>Confirm</Button>

            <Button
              variant="destructive"
              onClick={() => updateStatus("cancel")}
            >
              Cancel
            </Button>
          </>
        )}
      </div>

      <SalesOrderDetailCards so={so} />
    </div>
  );
};

export default SalesOrdersDetailPage;
