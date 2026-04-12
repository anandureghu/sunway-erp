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
import type {
  PurchaseOrder,
  Supplier,
  PurchaseInvoice,
  GoodsReceipt,
} from "@/types/purchase";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
  Package,
  CheckCircle,
  Send,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export type PurchaseOrderColumnActions = {
  /** Navigate to full PO detail */
  onOpenOrder?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  /** Quick preview in dialog (optional) */
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  /** Goods receipt flow */
  onReceiveGoods?: (orderId: string) => void;
  /** Link to originating PR */
  onViewRequisition?: (requisitionId: string) => void;
};

// Purchase Order Columns
export function createPurchaseOrderColumns(
  actions: PurchaseOrderColumnActions = {},
): ColumnDef<PurchaseOrder>[] {
  const {
    onOpenOrder,
    onConfirm,
    onCancel,
    onViewDetails,
    onEdit,
    onReceiveGoods,
    onViewRequisition,
  } = actions;

  return [
    {
      accessorKey: "orderNo",
      header: "Order No",
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue("orderNo")}</span>;
      },
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => {
        const supplier = row.original.supplier;
        // Handle both Supplier type (with name) and Vendor type (with vendorName)
        const supplierName = supplier?.name || (supplier as any)?.vendorName || "N/A";
        const supplierCode = supplier?.code || (supplier as any)?.id || "";
        return (
          <div className="flex flex-col">
            <span className="font-medium">{supplierName}</span>
            {supplierCode && (
              <span className="text-xs text-gray-500">{supplierCode}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "orderDate",
      header: "Order Date",
      cell: ({ row }) => {
        const date = row.getValue("orderDate") as string;
        return <span>{format(new Date(date), "MMM dd, yyyy")}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusColors: Record<string, string> = {
          draft: "bg-gray-100 text-gray-800",
          pending: "bg-yellow-100 text-yellow-800",
          confirmed: "bg-blue-100 text-blue-800",
          approved: "bg-blue-100 text-blue-800",
          ordered: "bg-purple-100 text-purple-800",
          partially_received: "bg-orange-100 text-orange-800",
          received: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
        };
        return (
          <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
            {status
              .replace("_", " ")
              .split(" ")
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join(" ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "total",
      header: "Total Amount",
      cell: ({ row }) => {
        const amount = row.getValue("total") as number;
        return <span className="font-semibold">₹ {amount.toLocaleString()}</span>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original;
        const st = (order.status || "").toLowerCase();
        const vendorOk = order.vendorPaymentSettled !== false;
        const canRelease = st === "draft" && vendorOk;
        const canCancel = st === "draft";
        const canReceive =
          st === "confirmed" ||
          st === "ordered" ||
          st === "partially_received" ||
          st === "approved";
        const reqId = order.requisitionId;

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
                <DropdownMenuLabel>Order</DropdownMenuLabel>
                {onOpenOrder && (
                  <DropdownMenuItem onClick={() => onOpenOrder(order.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Open detail
                  </DropdownMenuItem>
                )}
                {onViewDetails && (
                  <DropdownMenuItem onClick={() => onViewDetails(order.id)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Quick preview
                  </DropdownMenuItem>
                )}

                {reqId && onViewRequisition && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Source</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => onViewRequisition(reqId)}
                    >
                      <Link2 className="mr-2 h-4 w-4" />
                      View requisition
                    </DropdownMenuItem>
                  </>
                )}

                {(canRelease || canReceive) && <DropdownMenuSeparator />}
                {(canRelease || canReceive) && (
                  <DropdownMenuLabel>Procurement</DropdownMenuLabel>
                )}
                {canRelease && onConfirm && (
                  <DropdownMenuItem onClick={() => onConfirm(order.id)}>
                    <Send className="mr-2 h-4 w-4" />
                    Release to supplier
                  </DropdownMenuItem>
                )}
                {order.status === "draft" && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(order.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit draft
                  </DropdownMenuItem>
                )}
                {canReceive && onReceiveGoods && (
                  <DropdownMenuItem onClick={() => onReceiveGoods(order.id)}>
                    <Package className="mr-2 h-4 w-4" />
                    Record receipt
                  </DropdownMenuItem>
                )}

                {canCancel && onCancel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Danger</DropdownMenuLabel>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => onCancel(order.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancel order
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

// Backward compatibility - export default columns without handlers
export const PURCHASE_ORDER_COLUMNS: ColumnDef<PurchaseOrder>[] =
  createPurchaseOrderColumns();

// Supplier Columns
export const SUPPLIER_COLUMNS: ColumnDef<Supplier>[] = [
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "name",
    header: "Supplier Name",
  },
  {
    accessorKey: "contactPerson",
    header: "Contact Person",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number | undefined;
      return rating ? (
        <span className="font-medium">{rating.toFixed(1)} ⭐</span>
      ) : (
        <span>-</span>
      );
    },
  },
  {
    accessorKey: "onTimeDeliveryRate",
    header: "On-Time %",
    cell: ({ row }) => {
      const rate = row.getValue("onTimeDeliveryRate") as number | undefined;
      return rate ? <span>{rate}%</span> : <span>-</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          className={
            status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: () => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Supplier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Purchase Invoice Columns
export const PURCHASE_INVOICE_COLUMNS: ColumnDef<PurchaseInvoice>[] = [
  {
    accessorKey: "invoiceNo",
    header: "Invoice No",
    cell: ({ row }) => {
      return <span className="font-medium">{row.getValue("invoiceNo")}</span>;
    },
  },
  {
    accessorKey: "supplierName",
    header: "Supplier",
  },
  {
    accessorKey: "date",
    header: "Invoice Date",
    cell: ({ row }) => {
      const date = row.getValue("date") as string;
      return <span>{format(new Date(date), "MMM dd, yyyy")}</span>;
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
      const date = row.getValue("dueDate") as string;
      return <span>{format(new Date(date), "MMM dd, yyyy")}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusColors: Record<string, string> = {
        draft: "bg-gray-100 text-gray-800",
        pending: "bg-yellow-100 text-yellow-800",
        paid: "bg-green-100 text-green-800",
        partially_paid: "bg-blue-100 text-blue-800",
        overdue: "bg-red-100 text-red-800",
        cancelled: "bg-gray-100 text-gray-800",
      };
      return (
        <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
          {status
            .replace("_", " ")
            .split(" ")
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "total",
    header: "Total Amount",
    cell: ({ row }) => {
      const amount = row.getValue("total") as number;
      return <span className="font-semibold">₹ {amount.toLocaleString()}</span>;
    },
  },
  {
    id: "actions",
    cell: () => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Goods Receipt Columns
export const GOODS_RECEIPT_COLUMNS: ColumnDef<GoodsReceipt>[] = [
  {
    accessorKey: "receiptNo",
    header: "Receipt No",
    cell: ({ row }) => {
      return <span className="font-medium">{row.getValue("receiptNo")}</span>;
    },
  },
  {
    accessorKey: "order.orderNo",
    header: "Purchase Order",
    cell: ({ row }) => {
      return <span>{row.original.order?.orderNo || "N/A"}</span>;
    },
  },
  {
    accessorKey: "receiptDate",
    header: "Receipt Date",
    cell: ({ row }) => {
      const date = row.getValue("receiptDate") as string;
      return <span>{format(new Date(date), "MMM dd, yyyy")}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusColors: Record<string, string> = {
        pending: "bg-gray-100 text-gray-800",
        in_progress: "bg-yellow-100 text-yellow-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
      };
      return (
        <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
          {status
            .replace("_", " ")
            .split(" ")
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      return <span>{row.original.items.length} items</span>;
    },
  },
  {
    id: "actions",
    cell: () => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Inspection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
