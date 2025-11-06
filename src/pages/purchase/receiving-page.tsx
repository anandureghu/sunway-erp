import { useState } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GOODS_RECEIPT_COLUMNS } from "@/lib/columns/purchase-columns";
import { goodsReceipts, purchaseOrders, addGoodsReceipt, getPurchaseOrderById } from "@/lib/purchase-data";
import { warehouses } from "@/lib/inventory-data";
import { Plus, Search, ArrowLeft, ClipboardCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GOODS_RECEIPT_SCHEMA, type GoodsReceiptFormData } from "@/schema/purchase";
import { z } from "zod";
import type { GoodsReceiptItem, GoodsReceipt } from "@/types/purchase";

export default function ReceivingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  const filteredReceipts = goodsReceipts.filter((receipt) => {
    return (
      receipt.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.order?.orderNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Get orders ready for receiving
  const ordersReadyForReceiving = purchaseOrders.filter(
    (order) => order.status === "ordered" || order.status === "partially_received"
  );

  if (showCreateForm) {
    return <CreateReceiptForm 
      onCancel={() => setShowCreateForm(false)} 
      orderId={selectedOrderId}
    />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory/purchase">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Receiving & Quality Inspection</h1>
            <p className="text-muted-foreground">Receive goods and perform quality inspection</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Receipt
        </Button>
      </div>

      {/* Orders Ready for Receiving */}
      {ordersReadyForReceiving.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Orders Ready for Receiving</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ordersReadyForReceiving.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{order.orderNo}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.supplier?.name} • Expected: {order.expectedDate}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setShowCreateForm(true);
                    }}
                  >
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Receive Goods
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Goods Receipts</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search receipts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={GOODS_RECEIPT_COLUMNS} data={filteredReceipts} />
        </CardContent>
      </Card>
    </div>
  );
}

