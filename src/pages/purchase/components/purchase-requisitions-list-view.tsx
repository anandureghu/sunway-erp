import { Link } from "react-router-dom";
import { ArrowLeft, ClipboardList, Search } from "lucide-react";
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
import type { PurchaseRequisition } from "@/types/purchase";
import type { ColumnDef, Row } from "@tanstack/react-table";

type Props = {
  loading: boolean;
  error: string | null;
  requisitions: PurchaseRequisition[];
  searchQuery: string;
  statusFilter: string;
  columns: ColumnDef<PurchaseRequisition>[];
  onCreateNew: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRetry: () => void;
  onRowClick: (row: Row<PurchaseRequisition>) => void;
};

export function PurchaseRequisitionsListView({
  loading,
  error,
  requisitions,
  searchQuery,
  statusFilter,
  columns,
  onCreateNew,
  onSearchChange,
  onStatusChange,
  onRetry,
  onRowClick,
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
                  Purchase requisitions
                </h1>
                <p className="text-sm text-white/70 mt-1">
                  Submit for approval; approving creates a draft purchase order
                </p>
              </div>
            </div>
            <Button
              onClick={onCreateNew}
              className="bg-white text-black hover:bg-white/90"
            >
              Create requisition
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Requisitions
              <Badge variant="secondary">{requisitions.length}</Badge>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search…"
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
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading…
            </div>
          ) : error ? (
            <div className="py-10 text-center space-y-3">
              <div className="text-red-600 font-medium">{error}</div>
              <Button variant="outline" onClick={onRetry}>
                Retry
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={requisitions}
              onRowClick={onRowClick}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
