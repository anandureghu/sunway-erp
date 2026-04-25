import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search, Filter, ShoppingBag } from "lucide-react";
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
import type { SalesOrder } from "@/types/sales";
import type { ColumnDef } from "@tanstack/react-table";

type Props = {
  loading: boolean;
  error: string | null;
  orders: SalesOrder[];
  historyOrders: SalesOrder[];
  searchQuery: string;
  statusFilter: string;
  columns: ColumnDef<SalesOrder>[];
  onCreateNew: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRowClick: (id: string) => void;
};

export function SalesOrdersListView({
  loading,
  error,
  orders,
  historyOrders,
  searchQuery,
  statusFilter,
  columns,
  onCreateNew,
  onSearchChange,
  onStatusChange,
  onRowClick,
}: Props) {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card className="border-0 shadow-md bg-gradient-to-r from-zinc-900 via-slate-900 to-zinc-800 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/10">
                <Link to="/inventory/sales">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">
                  Sales
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold">Manage Sales Orders</h1>
              </div>
            </div>
            <Button onClick={onCreateNew} className="bg-white text-black hover:bg-white/90">
              <Plus className="mr-2 h-4 w-4" />
              Create New Order
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Orders
              <Badge variant="secondary">{orders.length}</Badge>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search order no / customer..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 w-72"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={onStatusChange}>
                  <SelectTrigger className="w-44 pl-8">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="picked">Picked</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              Loading sales orders...
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-600">{error}</div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              No orders match your filters.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={orders}
              onRowClick={(row) => onRowClick(row.original.id)}
            />
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              Order History
              <Badge variant="secondary">{historyOrders.length}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              Loading order history...
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-600">{error}</div>
          ) : historyOrders.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              No cancelled orders in history.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={historyOrders}
              onRowClick={(row) => onRowClick(row.original.id)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
