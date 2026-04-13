"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PurchaseRequisition } from "@/types/purchase";
import type { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Send,
  CheckCircle2,
  ShoppingCart,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/lib/status-badge";

export type PurchaseRequisitionColumnActions = {
  /** Navigate to PR detail */
  onOpenDetail: (id: string) => void;
  onSubmit?: (id: string) => void;
  onApprove?: (id: string) => void;
  /** When PR was converted, open the generated PO */
  onOpenPurchaseOrder?: (poId: string) => void;
};

export function createPurchaseRequisitionColumns(
  actions: PurchaseRequisitionColumnActions,
): ColumnDef<PurchaseRequisition>[] {
  const { onOpenDetail, onSubmit, onApprove, onOpenPurchaseOrder } = actions;

  return [
    {
      accessorKey: "requisitionNo",
      header: "Requisition",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("requisitionNo")}</span>
      ),
    },
    {
      accessorKey: "requestedByName",
      header: "Requested by",
      cell: ({ row }) => (
        <span>
          {row.getValue("requestedByName") ||
            row.original.requestedBy ||
            "—"}
        </span>
      ),
    },
    {
      id: "supplier",
      header: "Preferred supplier",
      cell: ({ row }) => (
        <span>{row.original.preferredSupplierName || "—"}</span>
      ),
    },
    {
      accessorKey: "departmentName",
      header: "Department",
      cell: ({ row }) => (
        <span>
          {row.original.departmentName || row.original.department || "—"}
        </span>
      ),
    },
    {
      accessorKey: "requestedDate",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("requestedDate") as string;
        return (
          <span>
            {date ? format(new Date(date), "MMM dd, yyyy") : "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <StatusBadge
            status={status}
            label={status.charAt(0).toUpperCase() + status.slice(1)}
          />
        );
      },
    },
    {
      accessorKey: "items",
      header: "Lines",
      cell: ({ row }) => <span>{row.original.items.length}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const req = row.original;
        const canSubmit = req.status === "draft";
        const canApprove = req.status === "submitted";
        const isConverted = req.status === "converted";
        const poId = req.createdPurchaseOrderId;

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Actions</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Requisition</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onOpenDetail(req.id)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Open detail
                </DropdownMenuItem>

                {(canSubmit || canApprove) && <DropdownMenuSeparator />}
                {(canSubmit || canApprove) && (
                  <DropdownMenuLabel>Workflow</DropdownMenuLabel>
                )}
                {canSubmit && onSubmit && (
                  <DropdownMenuItem onClick={() => onSubmit(req.id)}>
                    <Send className="mr-2 h-4 w-4" />
                    Submit for approval
                  </DropdownMenuItem>
                )}
                {canApprove && onApprove && (
                  <DropdownMenuItem onClick={() => onApprove(req.id)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve &amp; create PO
                  </DropdownMenuItem>
                )}

                {isConverted && poId && onOpenPurchaseOrder && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Procurement</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => onOpenPurchaseOrder(poId)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Open purchase order
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
