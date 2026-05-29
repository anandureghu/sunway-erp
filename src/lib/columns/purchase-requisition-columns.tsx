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
  Archive,
  Loader2,
  Undo2,
  XCircle,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/lib/status-badge";

export type PurchaseRequisitionColumnActions = {
  /** Navigate to PR detail */
  onOpenDetail: (id: string) => void;
  onSubmit?: (id: string) => void;
  onApprove?: (id: string) => void;
  onSendBack?: (id: string) => void;
  onReject?: (id: string) => void;
  onRevise?: (id: string) => void;
  /** When PR was converted, open the generated PO */
  onOpenPurchaseOrder?: (poId: string) => void;
  onArchive?: (id: string) => void;
  processingRequisitionId?: string | null;
  processingAction?: "archive" | null;
};

export function createPurchaseRequisitionColumns(
  actions: PurchaseRequisitionColumnActions,
): ColumnDef<PurchaseRequisition>[] {
  const {
    onOpenDetail,
    onSubmit,
    onApprove,
    onSendBack,
    onReject,
    onRevise,
    onOpenPurchaseOrder,
    onArchive,
    processingRequisitionId,
    processingAction,
  } = actions;

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
          {row.getValue("requestedByName") || row.original.requestedBy || "—"}
        </span>
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
      header: "Requested",
      cell: ({ row }) => {
        const date = row.getValue("requestedDate") as string;
        return (
          <span>{date ? format(new Date(date), "MMM dd, yyyy") : "—"}</span>
        );
      },
    },
    {
      id: "requiredDelivery",
      header: "Required delivery",
      cell: ({ row }) => {
        const date =
          row.original.requiredDeliveryDate || row.original.requiredDate;
        return (
          <span>{date ? format(new Date(date), "MMM dd, yyyy") : "—"}</span>
        );
      },
    },
    {
      id: "projectCode",
      header: "Project",
      cell: ({ row }) => <span>{row.original.projectCode || "—"}</span>,
    },
    {
      id: "convertedAt",
      header: "Converted",
      cell: ({ row }) => {
        const date = row.original.convertedAt;
        return (
          <span>{date ? format(new Date(date), "MMM dd, yyyy") : "—"}</span>
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
      header: "Actions",
      cell: ({ row }) => {
        const req = row.original;
        const canSubmit = req.status === "draft";
        const canApprove = req.status === "submitted";
        const canReview = req.status === "submitted";
        const canRevise = req.status === "rejected";
        const isConverted = req.status === "converted";
        const isRejected = req.status === "rejected";
        const canArchive = !req.archived && (isConverted || isRejected);
        const poId = req.createdPurchaseOrderId;
        const isProcessing = processingRequisitionId === req.id;

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

                {(canSubmit || canApprove || canReview || canRevise) && (
                  <DropdownMenuSeparator />
                )}
                {(canSubmit || canApprove || canReview || canRevise) && (
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
                    Approve &amp; create Purchase Order
                  </DropdownMenuItem>
                )}
                {canReview && onSendBack && (
                  <DropdownMenuItem onClick={() => onSendBack(req.id)}>
                    <Undo2 className="mr-2 h-4 w-4" />
                    Send back
                  </DropdownMenuItem>
                )}
                {canReview && onReject && (
                  <DropdownMenuItem onClick={() => onReject(req.id)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </DropdownMenuItem>
                )}
                {canRevise && onRevise && (
                  <DropdownMenuItem onClick={() => onRevise(req.id)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Revise &amp; edit
                  </DropdownMenuItem>
                )}

                {isConverted && poId && onOpenPurchaseOrder && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Procurement</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onOpenPurchaseOrder(poId)}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Open purchase order
                    </DropdownMenuItem>
                  </>
                )}

                {canArchive && onArchive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={isProcessing}
                      onClick={() => onArchive(req.id)}
                    >
                      {isProcessing && processingAction === "archive" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing && processingAction === "archive"
                        ? "Archiving..."
                        : "Archive"}
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
