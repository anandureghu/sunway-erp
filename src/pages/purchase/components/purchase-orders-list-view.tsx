import { Link } from "react-router-dom";
import { ArrowLeft, Search, ShoppingCart } from "lucide-react";
import { DataTable } from "@/components/datatable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PurchaseOrder } from "@/types/purchase";
import type { ColumnDef, Row } from "@tanstack/react-table";

type Props = {
  loading: boolean;
  error: string | null;
  orders: PurchaseOrder[];
  searchQuery: string;
  statusFilter: string;
  columns: ColumnDef<PurchaseOrder>[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRowClick: (row: Row<PurchaseOrder>) => void;
  onRetry: () => void;
};

export function PurchaseOrdersListView({
  loading,
  error,
  orders,
  searchQuery,
  statusFilter,
  columns,
  onSearchChange,
  onStatusChange,
  onRowClick,
  onRetry,
}: Props) {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card className="border-0 shadow-md bg-gradient-to-r from-zinc-900 via-slate-900 to-zinc-800 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-white hover:bg-white/10"
              >
                <Link to="/inventory/purchase">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">
                  Purchase
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Purchase Orders
                </h1>
                <p className="text-sm text-white/70 mt-1">
                  Orders are created when a requisition is approved
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Orders
              <Badge variant="secondary">{orders.length}</Badge>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 w-56 sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="partially_received">
                    Partially received
                  </SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading purchase orders…
            </div>
          ) : error ? (
            <div className="py-10 text-center space-y-4">
              <div className="text-red-600 font-medium">{error}</div>
              {error.includes("not configured") && (
                <p className="text-sm text-muted-foreground">
                  Expected:{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    GET /api/purchase/orders
                  </code>
                </p>
              )}
              <Button variant="outline" onClick={onRetry}>
                Retry
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={orders}
              onRowClick={onRowClick}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
